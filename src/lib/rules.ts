import { getCatalogItem, ROOM_WIDTH, ROOM_DEPTH } from "./catalog";
import type {
  CatalogItem,
  GridPosition,
  PlacedDeskItem,
  PlacedFloorItem,
  ValidationResult,
} from "./types";

const OK: ValidationResult = { valid: true };

function fail(reason: string): ValidationResult {
  return { valid: false, reason };
}

function footprintCells(item: CatalogItem, pos: GridPosition, rotationY: number) {
  if (!item.footprint) return [pos];
  const { w, d } = rotationY === 90 || rotationY === 270
    ? { w: item.footprint.d, d: item.footprint.w }
    : item.footprint;
  const cells: GridPosition[] = [];
  for (let dx = 0; dx < w; dx++) {
    for (let dz = 0; dz < d; dz++) {
      cells.push({ x: pos.x + dx, z: pos.z + dz });
    }
  }
  return cells;
}

/**
 * Can `item` be placed on the floor at `pos`, given everything already placed?
 * This is the single source of truth the 3D ghost-preview and the "Add to
 * workspace" button both call, so the rules can never drift from the visuals.
 */
export function canPlaceOnFloor(
  item: CatalogItem,
  pos: GridPosition,
  rotationY: 0 | 90 | 180 | 270,
  existing: PlacedFloorItem[],
  ignoreInstanceId?: string,
): ValidationResult {
  if (item.placement !== "floor") {
    return fail(`${item.name} doesn't go on the floor — try a desk slot.`);
  }

  const cells = footprintCells(item, pos, rotationY);

  for (const cell of cells) {
    if (cell.x < 0 || cell.z < 0 || cell.x >= ROOM_WIDTH || cell.z >= ROOM_DEPTH) {
      return fail("That's outside the room.");
    }
  }

  for (const other of existing) {
    if (other.instanceId === ignoreInstanceId) continue;
    const otherItem = getCatalogItem(other.catalogId);
    if (!otherItem) continue;
    const otherCells = footprintCells(otherItem, other.position, other.rotationY);
    const overlaps = cells.some((c) =>
      otherCells.some((oc) => oc.x === c.x && oc.z === c.z),
    );
    if (overlaps) {
      return fail(`That space is already taken by the ${otherItem.name}.`);
    }
  }

  return OK;
}

/**
 * Can `item` (a monitor or accessory) be placed into slot `slotIndex` of the
 * desk identified by `deskInstanceId`?
 */
export function canPlaceOnDesk(
  item: CatalogItem,
  deskFloorItem: PlacedFloorItem,
  existingDeskItems: PlacedDeskItem[],
  ignoreInstanceId?: string,
): ValidationResult {
  if (item.placement !== "desk-slot") {
    return fail(`${item.name} doesn't go on a desk — try the floor.`);
  }

  const deskCatalog = getCatalogItem(deskFloorItem.catalogId);
  if (!deskCatalog || !deskCatalog.desk) {
    return fail("That's not a desk.");
  }

  const itemsOnThisDesk = existingDeskItems.filter(
    (d) => d.deskInstanceId === deskFloorItem.instanceId && d.instanceId !== ignoreInstanceId,
  );

  if (item.slotType === "monitor") {
    const monitorCount = itemsOnThisDesk.filter((d) => {
      const c = getCatalogItem(d.catalogId);
      return c?.slotType === "monitor";
    }).length;

    if (monitorCount >= deskCatalog.desk.maxMonitors) {
      return fail(
        `${deskCatalog.name} only fits ${deskCatalog.desk.maxMonitors} monitor${deskCatalog.desk.maxMonitors > 1 ? "s" : ""}.`,
      );
    }

    if (item.monitor && deskCatalog.desk.widthCm < item.monitor.minDeskWidthCm) {
      return fail(
        `${item.name} needs at least a ${item.monitor.minDeskWidthCm}cm-wide desk. ${deskCatalog.name} is ${deskCatalog.desk.widthCm}cm.`,
      );
    }
  }

  if (item.slotType === "accessory") {
    const accessoryCount = itemsOnThisDesk.filter((d) => {
      const c = getCatalogItem(d.catalogId);
      return c?.slotType === "accessory";
    }).length;

    if (accessoryCount >= deskCatalog.desk.accessorySlots) {
      return fail(`${deskCatalog.name} has no free accessory slots left.`);
    }
  }

  return OK;
}
