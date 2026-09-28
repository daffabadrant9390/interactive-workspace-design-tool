"use client";

import { useMemo } from "react";
import { getCatalogItem } from "@/lib/catalog";
import { getDeskSlotRecipe } from "./furniture-recipes";
import { PartsGroup } from "./PartsGroup";
import { useDesignStore } from "@/store/design-store";
import type { CatalogItem } from "@/lib/types";

const DESK_TOP_Y = 0.75;

/**
 * Renders every monitor/accessory sitting on one desk. Monitors line up
 * along the back edge, accessories along the front — purely cosmetic
 * spacing, the rules engine (src/lib/rules.ts) is what actually decides
 * whether an item is allowed on the desk at all.
 */
export function DeskSlotItems({
  deskInstanceId,
  deskItem,
}: {
  deskInstanceId: string;
  deskItem: CatalogItem;
}) {
  const deskItems = useDesignStore((s) => s.deskItems);
  const removeDeskItem = useDesignStore((s) => s.removeDeskItem);

  const onThisDesk = deskItems.filter((d) => d.deskInstanceId === deskInstanceId);
  const monitors = onThisDesk.filter((d) => getCatalogItem(d.catalogId)?.slotType === "monitor");
  const accessories = onThisDesk.filter((d) => getCatalogItem(d.catalogId)?.slotType === "accessory");
  const w = deskItem.footprint?.w ?? 2;

  return (
    <>
      {monitors.map((d, i) => (
        <SlotMesh
          key={d.instanceId}
          catalogId={d.catalogId}
          color={d.color}
          x={spread(i, monitors.length, w)}
          z={-0.18}
          y={DESK_TOP_Y}
          onRemove={() => removeDeskItem(d.instanceId)}
        />
      ))}
      {accessories.map((d, i) => (
        <SlotMesh
          key={d.instanceId}
          catalogId={d.catalogId}
          color={d.color}
          x={spread(i, accessories.length, w)}
          z={0.2}
          y={DESK_TOP_Y}
          onRemove={() => removeDeskItem(d.instanceId)}
        />
      ))}
    </>
  );
}

function spread(index: number, count: number, width: number): number {
  if (count <= 1) return 0;
  const usable = width * 0.7;
  return -usable / 2 + (usable * index) / (count - 1);
}

function SlotMesh({
  catalogId,
  color,
  x,
  y,
  z,
  onRemove,
}: {
  catalogId: string;
  color?: string;
  x: number;
  y: number;
  z: number;
  onRemove: () => void;
}) {
  const item = getCatalogItem(catalogId);
  const parts = useMemo(() => (item ? getDeskSlotRecipe(item) : []), [item]);
  if (!item) return null;

  return (
    <group
      position={[x, y, z]}
      onContextMenu={(e) => {
        e.stopPropagation();
        e.nativeEvent.preventDefault();
        onRemove();
      }}
    >
      <PartsGroup parts={parts} baseColor={color ?? item.color} />
    </group>
  );
}
