import * as THREE from "three";
import { boxGeo, cylinderGeo, coneGeo, sphereGeo, getMaterial } from "./geometry";
import type { Part, PartShape } from "./furniture-recipes";

const GEOMETRY_BY_SHAPE: Record<PartShape, THREE.BufferGeometry> = {
  box: boxGeo,
  cylinder: cylinderGeo,
  cone: coneGeo,
  sphere: sphereGeo,
};

/**
 * Renders a furniture recipe (a handful of Part descriptors) as meshes that
 * all share the same handful of module-level geometries/materials from
 * geometry.ts. No allocation happens per render — only position/scale
 * differ per mesh.
 */
export function PartsGroup({ parts, baseColor }: { parts: Part[]; baseColor: string }) {
  return (
    <group>
      {parts.map((part, i) => (
        <mesh
          key={i}
          geometry={GEOMETRY_BY_SHAPE[part.shape]}
          material={getMaterial(part.color ?? baseColor)}
          position={part.position}
          scale={part.scale}
          rotation={part.rotation ?? [0, 0, 0]}
          castShadow={false}
          receiveShadow={false}
        />
      ))}
    </group>
  );
}
