import * as THREE from "three";

/**
 * Performance rule for the whole 3D layer: every mesh in the scene reuses one
 * of these shared, module-scoped geometries and one cached material per
 * color. Nothing calls `new THREE.*Geometry()` per furniture instance — a
 * desk, a chair, and a lamp all instantiate the exact same BoxGeometry
 * object, just scaled and positioned differently. That keeps GPU buffer
 * uploads to a handful total, no matter how many items are on the floor.
 */
export const boxGeo = new THREE.BoxGeometry(1, 1, 1);
export const cylinderGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 10); // low-poly on purpose
export const coneGeo = new THREE.ConeGeometry(0.5, 1, 10);
export const sphereGeo = new THREE.SphereGeometry(0.5, 12, 8);
export const planeGeo = new THREE.PlaneGeometry(1, 1);

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

export function getMaterial(color: string, opts?: { roughness?: number; metalness?: number }): THREE.MeshStandardMaterial {
  const key = `${color}:${opts?.roughness ?? 0.8}:${opts?.metalness ?? 0.05}`;
  let mat = materialCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color,
      roughness: opts?.roughness ?? 0.8,
      metalness: opts?.metalness ?? 0.05,
    });
    materialCache.set(key, mat);
  }
  return mat;
}

export const TILE_COLOR_A = "#eef1f5";
export const TILE_COLOR_B = "#e2e7ee";
export const VALID_GHOST_COLOR = "#4ade80";
export const INVALID_GHOST_COLOR = "#f87171";
