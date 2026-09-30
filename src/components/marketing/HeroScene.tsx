"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, PerspectiveCamera } from "@react-three/drei";
import type { Group, PerspectiveCamera as ThreePerspectiveCamera } from "three";
import { getCatalogItem } from "@/lib/catalog";
import { getFloorRecipe, getDeskSlotRecipe } from "@/components/scene/furniture-recipes";
import { PartsGroup } from "@/components/scene/PartsGroup";

/**
 * A small, purely decorative furnished room for the landing page hero.
 * It reuses the exact same recipes and shared geometry/material caches as
 * the real designer (see src/components/scene), so it costs almost nothing
 * extra to render: a handful of low-poly meshes and one slowly spinning
 * group. Unlike the real editor's Canvas, this one runs frameloop="always"
 * because it's the only 3D canvas on the page and the scene is tiny (under
 * fifteen draw calls), so a continuous render loop here is still cheap.
 */
function FurnishedRoom() {
  const desk = getCatalogItem("desk-standard")!;
  const chair = getCatalogItem("chair-ergonomic")!;
  const monitor = getCatalogItem("monitor-27-4k")!;
  const lamp = getCatalogItem("acc-lamp")!;
  const plant = getCatalogItem("break-plant")!;

  const groupRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.18;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.6, 40]} />
        <meshStandardMaterial color="#e7ebf3" />
      </mesh>

      <group position={[0, 0, 0]}>
        <PartsGroup parts={getFloorRecipe(desk)} baseColor={desk.color} />
        <group position={[0, 0.75, -0.18]}>
          <PartsGroup parts={getDeskSlotRecipe(monitor)} baseColor={monitor.color} />
        </group>
        <group position={[-0.6, 0.75, 0.2]}>
          <PartsGroup parts={getDeskSlotRecipe(lamp)} baseColor={lamp.color} />
        </group>
      </group>

      <group position={[0, 0, 0.95]}>
        <PartsGroup parts={getFloorRecipe(chair)} baseColor={chair.color} />
      </group>

      <group position={[1.5, 0, -0.7]}>
        <PartsGroup parts={getFloorRecipe(plant)} baseColor={plant.color} />
      </group>

      <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={6} blur={2} far={2} frames={1} />
    </group>
  );
}

export function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      shadows={false}
      className="!touch-none"
    >
      <color attach="background" args={["#131826"]} />
      <PerspectiveCamera
        makeDefault
        position={[3.2, 2.6, 4]}
        fov={38}
        onUpdate={(camera: ThreePerspectiveCamera) => camera.lookAt(0, 0.5, 0)}
      />
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} />
      <Suspense fallback={null}>
        <FurnishedRoom />
      </Suspense>
    </Canvas>
  );
}
