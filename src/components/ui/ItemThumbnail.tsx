"use client";

import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Center } from "@react-three/drei";
import { getFloorRecipe, getDeskSlotRecipe } from "@/components/scene/furniture-recipes";
import { PartsGroup } from "@/components/scene/PartsGroup";
import type { CatalogItem } from "@/lib/types";

/**
 * A tiny, real 3D preview of a catalog item — reuses the exact same
 * furniture "recipes" (and shared geometries/materials) as the main room,
 * so the icon is never a lie about what you're placing, and a color change
 * shows up immediately. Each thumbnail is its own <Canvas> with
 * frameloop="demand": it draws once on mount (or when its color changes)
 * and then costs ~0 — cheap even with a handful mounted at once in a list.
 */
export function ItemThumbnail({
  item,
  color,
  size = 56,
  className,
}: {
  item: CatalogItem;
  color?: string;
  size?: number;
  className?: string;
}) {
  const parts = useMemo(
    () => (item.placement === "floor" ? getFloorRecipe(item) : getDeskSlotRecipe(item)),
    [item],
  );

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Canvas
        frameloop="demand"
        dpr={1}
        camera={{ position: [1.5, 1.3, 1.7], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[2, 3, 2]} intensity={0.7} />
        <Center>
          <PartsGroup parts={parts} baseColor={color ?? item.color} />
        </Center>
        <LookAtOrigin watch={color ?? item.color} />
      </Canvas>
    </div>
  );
}

/** Points the camera at the origin once, then re-invalidates whenever `watch`
 * (the effective color) changes — the only thing that ever needs a repaint
 * on this frameloop="demand" canvas after the first frame. */
function LookAtOrigin({ watch }: { watch: string }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    camera.lookAt(0, 0, 0);
    invalidate();
  }, [camera, invalidate, watch]);
  return null;
}
