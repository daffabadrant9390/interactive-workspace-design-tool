"use client";

import { useMemo, useState } from "react";
import { Instances, Instance } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { ROOM_WIDTH, ROOM_DEPTH, TILE_SIZE } from "@/lib/catalog";
import { TILE_COLOR_A, TILE_COLOR_B, planeGeo } from "./geometry";
import { worldToTile } from "./layout";
import { useDesignStore } from "@/store/design-store";
import { GhostPreview } from "./GhostPreview";

/**
 * The floor is one InstancedMesh (via drei's <Instances>) for the whole
 * checkerboard — a single draw call for up to 48 tiles — plus one plane used
 * only for pointer raycasting (invisible material, no fill cost).
 */
export function RoomFloor() {
  const pending = useDesignStore((s) => s.pending);
  const floorItems = useDesignStore((s) => s.floorItems);
  const placeFloorItem = useDesignStore((s) => s.placeFloorItem);
  const moveFloorItem = useDesignStore((s) => s.moveFloorItem);
  const selectDesk = useDesignStore((s) => s.selectDesk);
  const selectFloorItem = useDesignStore((s) => s.selectFloorItem);
  const [hoverTile, setHoverTile] = useState<{ x: number; z: number } | null>(null);

  const tiles = useMemo(() => {
    const arr: { x: number; z: number; color: string }[] = [];
    for (let x = 0; x < ROOM_WIDTH; x++) {
      for (let z = 0; z < ROOM_DEPTH; z++) {
        arr.push({ x, z, color: (x + z) % 2 === 0 ? TILE_COLOR_A : TILE_COLOR_B });
      }
    }
    return arr;
  }, []);

  function handlePointerMove(e: ThreeEvent<PointerEvent>) {
    if (!pending) {
      if (hoverTile) setHoverTile(null);
      return;
    }
    const tile = worldToTile(e.point.x, e.point.z);
    setHoverTile(tile);
  }

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (!pending) {
      selectDesk(null);
      selectFloorItem(null);
      return;
    }
    const tile = worldToTile(e.point.x, e.point.z);
    if (pending.kind === "move") {
      moveFloorItem(pending.instanceId, tile);
    } else {
      placeFloorItem(tile);
    }
  }

  const movingItem = pending?.kind === "move"
    ? floorItems.find((f) => f.instanceId === pending.instanceId)
    : undefined;

  return (
    <group>
      <Instances geometry={planeGeo} limit={ROOM_WIDTH * ROOM_DEPTH}>
        <meshStandardMaterial roughness={0.95} />
        {tiles.map((t) => (
          <Instance
            key={`${t.x}-${t.z}`}
            position={[t.x * TILE_SIZE + TILE_SIZE / 2, 0, t.z * TILE_SIZE + TILE_SIZE / 2]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[TILE_SIZE * 0.97, TILE_SIZE * 0.97, 1]}
            color={t.color}
          />
        ))}
      </Instances>

      {/* Invisible raycast plane, sized exactly to the room, sits a hair above the tiles */}
      <mesh
        position={[(ROOM_WIDTH * TILE_SIZE) / 2, 0.001, (ROOM_DEPTH * TILE_SIZE) / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        visible={false}
      >
        <planeGeometry args={[ROOM_WIDTH * TILE_SIZE, ROOM_DEPTH * TILE_SIZE]} />
        <meshBasicMaterial />
      </mesh>

      {pending && hoverTile && (
        <GhostPreview
          catalogId={pending.catalogId}
          tile={hoverTile}
          rotationY={pending.kind === "move" ? movingItem?.rotationY ?? 0 : 0}
          ignoreInstanceId={pending.kind === "move" ? pending.instanceId : undefined}
          color={pending.kind === "floor" ? pending.color : movingItem?.color}
        />
      )}
    </group>
  );
}
