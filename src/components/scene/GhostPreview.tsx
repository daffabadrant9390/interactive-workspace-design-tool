"use client";

import { useMemo } from "react";
import { getCatalogItem } from "@/lib/catalog";
import { canPlaceOnFloor } from "@/lib/rules";
import { useDesignStore } from "@/store/design-store";
import { getFloorRecipe } from "./furniture-recipes";
import { tileToWorldCenter } from "./layout";
import { VALID_GHOST_COLOR, INVALID_GHOST_COLOR } from "./geometry";
import { PartsGroup } from "./PartsGroup";

/**
 * Sims-style ghost preview: follows the hovered tile, with a translucent
 * green/red footprint tile underneath depending on whether canPlaceOnFloor()
 * — the exact same function real placement uses — allows it. The preview
 * can never lie about what a click will do.
 */
export function GhostPreview({
  catalogId,
  tile,
  rotationY = 0,
  ignoreInstanceId,
  color,
}: {
  catalogId: string;
  tile: { x: number; z: number };
  /** The moving/placing item's current rotation — the ghost never lies about it. */
  rotationY?: 0 | 90 | 180 | 270;
  /** When repositioning an existing item, exclude it from its own overlap check. */
  ignoreInstanceId?: string;
  /** Color chosen in the preview modal, if any. */
  color?: string;
}) {
  const floorItems = useDesignStore((s) => s.floorItems);
  const item = getCatalogItem(catalogId);

  const validation = useMemo(() => {
    if (!item) return { valid: false };
    return canPlaceOnFloor(item, tile, rotationY, floorItems, ignoreInstanceId);
  }, [item, tile, rotationY, floorItems, ignoreInstanceId]);

  const parts = useMemo(() => (item ? getFloorRecipe(item) : []), [item]);
  if (!item) return null;

  const [cx, cz] = tileToWorldCenter(tile, item, rotationY);
  // The plane is drawn in the group's local (unrotated) space — the group's
  // own rotation below is what actually turns it, exactly like PartsGroup's
  // parts. Sizing this from the *rotated* footprint would rotate it twice.
  const w = item.footprint?.w ?? 1;
  const d = item.footprint?.d ?? 1;
  const tint = validation.valid ? VALID_GHOST_COLOR : INVALID_GHOST_COLOR;

  return (
    <group position={[cx, 0, cz]} rotation={[0, (rotationY * Math.PI) / 180, 0]}>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 0.95, d * 0.95]} />
        <meshBasicMaterial color={tint} transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <group>
        <PartsGroup parts={parts} baseColor={color ?? item.color} />
      </group>
    </group>
  );
}
