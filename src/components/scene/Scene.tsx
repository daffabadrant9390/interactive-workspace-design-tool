"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, PerspectiveCamera } from "@react-three/drei";
import { RoomFloor } from "./RoomFloor";
import { FloorFurniture } from "./FloorFurniture";
import { InvalidateOnChange } from "./InvalidateOnChange";
import { useDesignStore } from "@/store/design-store";
import { ROOM_WIDTH, ROOM_DEPTH } from "@/lib/catalog";

/**
 * Performance choices in this scene (see README for the full writeup):
 *  - frameloop="demand": zero redraws while idle; only renders on input or
 *    a store change, which InvalidateOnChange wires up.
 *  - dpr capped to [1, 1.5]: avoids full native-resolution rendering on
 *    high-density (Retina/4K) screens, the single biggest GPU cost lever.
 *  - No real-time shadow maps — one baked-looking ContactShadows pass gives
 *    the grounded look for a fraction of the cost.
 *  - Every mesh shares geometry/material instances (geometry.ts) so adding
 *    more furniture never adds GPU buffer uploads, only draw calls.
 *  - OrbitControls is bounded (no zooming into the floor or flying away)
 *    so users can't stumble into a degenerate, expensive camera angle.
 */
export function Scene() {
  const floorItems = useDesignStore((s) => s.floorItems);
  const centerX = (ROOM_WIDTH) / 2;
  const centerZ = (ROOM_DEPTH) / 2;

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, powerPreference: "high-performance" }}
      shadows={false}
      className="!touch-none"
    >
      <color attach="background" args={["#f4f6fa"]} />
      <PerspectiveCamera makeDefault position={[centerX + 6, 7, centerZ + 8]} fov={40} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 10, 4]} intensity={1.1} />

      <Suspense fallback={null}>
        <group>
          <RoomFloor />
          {floorItems.map((f) => (
            <FloorFurniture key={f.instanceId} placed={f} />
          ))}
          {/* Re-keying on the placed items forces exactly one shadow re-bake
              per change instead of every frame — frames={1} bakes once and
              stops, and the new key makes it bake again only when needed. */}
          <ContactShadows
            key={floorItems.map((f) => `${f.instanceId}:${f.position.x},${f.position.z}`).join("|")}
            position={[centerX, 0.001, centerZ]}
            opacity={0.35}
            scale={Math.max(ROOM_WIDTH, ROOM_DEPTH) * 1.4}
            blur={2}
            far={2}
            frames={1}
          />
        </group>
      </Suspense>

      <OrbitControls
        makeDefault
        target={[centerX, 0.5, centerZ]}
        minDistance={5}
        maxDistance={16}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.3}
        enablePan={false}
      />
      <InvalidateOnChange />
    </Canvas>
  );
}
