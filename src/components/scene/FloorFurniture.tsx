"use client";

import { useMemo, useState } from "react";
import { Html } from "@react-three/drei";
import { getCatalogItem } from "@/lib/catalog";
import { getFloorRecipe } from "./furniture-recipes";
import { PartsGroup } from "./PartsGroup";
import { tileToWorldCenter } from "./layout";
import { useDesignStore } from "@/store/design-store";
import type { PlacedFloorItem } from "@/lib/types";
import { DeskSlotItems } from "./DeskSlotItem";

export function FloorFurniture({ placed }: { placed: PlacedFloorItem }) {
  const item = getCatalogItem(placed.catalogId);
  const [hovered, setHovered] = useState(false);
  const removeFloorItem = useDesignStore((s) => s.removeFloorItem);
  const rotateFloorItem = useDesignStore((s) => s.rotateFloorItem);
  const beginMoveFloorItem = useDesignStore((s) => s.beginMoveFloorItem);
  const selectDesk = useDesignStore((s) => s.selectDesk);
  const selectedDeskInstanceId = useDesignStore((s) => s.selectedDeskInstanceId);
  const selectFloorItem = useDesignStore((s) => s.selectFloorItem);
  const selectedFloorInstanceId = useDesignStore((s) => s.selectedFloorInstanceId);
  const pending = useDesignStore((s) => s.pending);

  const parts = useMemo(() => (item ? getFloorRecipe(item) : []), [item]);
  if (!item) return null;

  // While this exact item is being picked up to move, hide the "real" mesh —
  // the GhostPreview already renders it following the cursor, so showing both
  // would look like two copies of the same desk.
  const isBeingMoved = pending?.kind === "move" && pending.instanceId === placed.instanceId;
  if (isBeingMoved) return null;

  const [cx, cz] = tileToWorldCenter(placed.position, item, placed.rotationY);
  const isDesk = item.category === "desk";
  const isSelectedDesk = isDesk && selectedDeskInstanceId === placed.instanceId;
  const isSelected = selectedFloorInstanceId === placed.instanceId;
  const showToolbar = (hovered || isSelected) && !pending;

  return (
    <group
      position={[cx, 0, cz]}
      rotation={[0, (placed.rotationY * Math.PI) / 180, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (isDesk) {
          selectDesk(isSelectedDesk ? null : placed.instanceId);
        }
        selectFloorItem(isSelected ? null : placed.instanceId);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        e.nativeEvent.preventDefault();
        removeFloorItem(placed.instanceId);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        rotateFloorItem(placed.instanceId);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <PartsGroup parts={parts} baseColor={placed.color ?? item.color} />
      {isSelectedDesk && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.0, 24]} />
          <meshBasicMaterial color="#4f46e5" transparent opacity={0.8} />
        </mesh>
      )}
      {(hovered || isSelected) && !pending && (
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.82, 24]} />
          <meshBasicMaterial color="#111827" transparent opacity={0.25} />
        </mesh>
      )}
      {isDesk && <DeskSlotItems deskInstanceId={placed.instanceId} deskItem={item} />}

      {showToolbar && (
        <Html position={[0, 1.35, 0]} center distanceFactor={8} zIndexRange={[10, 0]}>
          <div className="flex items-center gap-1 rounded-full border border-border bg-surface/95 p-1 shadow-lg backdrop-blur">
            <button
              type="button"
              title="Rotate"
              onClick={(e) => {
                e.stopPropagation();
                rotateFloorItem(placed.instanceId);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-sm hover:bg-surface-2"
            >
              ⟳
            </button>
            <button
              type="button"
              title="Move"
              onClick={(e) => {
                e.stopPropagation();
                beginMoveFloorItem(placed.instanceId);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-sm hover:bg-surface-2"
            >
              ✥
            </button>
            <button
              type="button"
              title="Remove"
              onClick={(e) => {
                e.stopPropagation();
                removeFloorItem(placed.instanceId);
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
