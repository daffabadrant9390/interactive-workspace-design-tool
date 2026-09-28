import { TILE_SIZE } from "@/lib/catalog";
import type { CatalogItem, GridPosition } from "@/lib/types";

export function rotatedFootprint(item: CatalogItem, rotationY: number) {
  const base = item.footprint ?? { w: 1, d: 1 };
  return rotationY === 90 || rotationY === 270 ? { w: base.d, d: base.w } : base;
}

/** Center of a placed item's footprint, in world (three.js) units. */
export function tileToWorldCenter(
  pos: GridPosition,
  item: CatalogItem,
  rotationY: number,
): [number, number] {
  const { w, d } = rotatedFootprint(item, rotationY);
  return [
    pos.x * TILE_SIZE + (w * TILE_SIZE) / 2,
    pos.z * TILE_SIZE + (d * TILE_SIZE) / 2,
  ];
}

/** Given a world-space point on the floor plane, find the grid cell under it. */
export function worldToTile(x: number, z: number): GridPosition {
  return { x: Math.floor(x / TILE_SIZE), z: Math.floor(z / TILE_SIZE) };
}
