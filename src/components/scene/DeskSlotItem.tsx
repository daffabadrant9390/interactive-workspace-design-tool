"use client";

import { useMemo, useState } from "react";
import { Html } from "@react-three/drei";
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
  const rotateDeskItem = useDesignStore((s) => s.rotateDeskItem);

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
          rotationY={d.rotationY ?? 0}
          x={spread(i, monitors.length, w)}
          z={-0.18}
          y={DESK_TOP_Y}
          onRemove={() => removeDeskItem(d.instanceId)}
          onRotate={() => rotateDeskItem(d.instanceId)}
        />
      ))}
      {accessories.map((d, i) => (
        <SlotMesh
          key={d.instanceId}
          catalogId={d.catalogId}
          color={d.color}
          rotationY={d.rotationY ?? 0}
          x={spread(i, accessories.length, w)}
          z={0.2}
          y={DESK_TOP_Y}
          onRemove={() => removeDeskItem(d.instanceId)}
          onRotate={() => rotateDeskItem(d.instanceId)}
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
  rotationY,
  x,
  y,
  z,
  onRemove,
  onRotate,
}: {
  catalogId: string;
  color?: string;
  rotationY: 0 | 90 | 180 | 270;
  x: number;
  y: number;
  z: number;
  onRemove: () => void;
  onRotate: () => void;
}) {
  const item = getCatalogItem(catalogId);
  const [hovered, setHovered] = useState(false);
  const parts = useMemo(() => (item ? getDeskSlotRecipe(item) : []), [item]);
  if (!item) return null;

  return (
    <group
      position={[x, y, z]}
      rotation={[0, (rotationY * Math.PI) / 180, 0]}
      // Every handler below stops propagation so a click/hover on a monitor
      // or accessory never bubbles up to the desk it's sitting on (which
      // would otherwise just toggle the desk's own selection instead).
      onClick={(e) => {
        e.stopPropagation();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onRotate();
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        e.nativeEvent.preventDefault();
        onRemove();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      <PartsGroup parts={parts} baseColor={color ?? item.color} />
      {hovered && (
        <Html position={[0, 0.4, 0]} center distanceFactor={8} zIndexRange={[10, 0]}>
          <div className="flex items-center gap-1 rounded-full border border-border bg-surface/95 p-1 shadow-lg backdrop-blur">
            <button
              type="button"
              title="Rotate"
              onClick={(e) => {
                e.stopPropagation();
                onRotate();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-sm hover:bg-surface-2"
            >
              ⟳
            </button>
            <button
              type="button"
              title="Remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-invalid hover:bg-invalid/10"
            >
              ✕
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}
