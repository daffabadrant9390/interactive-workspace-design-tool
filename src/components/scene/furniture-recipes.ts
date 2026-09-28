import type { CatalogItem } from "@/lib/types";

export type PartShape = "box" | "cylinder" | "cone" | "sphere";

export interface Part {
  shape: PartShape;
  position: [number, number, number];
  scale: [number, number, number];
  color?: string; // overrides the item's base color for this one part
  rotation?: [number, number, number];
}

/**
 * Every furniture piece is a handful of primitive parts (a box top, some
 * cylinder legs) authored in "local footprint space": X spans the item's
 * unrotated width in tiles, Z its depth, both centered on 0, Y is height
 * off the floor. Keeping recipes this small (3-6 parts, low-poly cylinders)
 * is what keeps the whole room cheap to render even with a dozen items on
 * screen — see the README's Three.js performance section.
 */
export function getFloorRecipe(item: CatalogItem): Part[] {
  const w = item.footprint?.w ?? 1;
  const d = item.footprint?.d ?? 1;

  switch (item.category) {
    case "desk":
      return [
        // tabletop
        { shape: "box", position: [0, 0.72, 0], scale: [w * 0.95, 0.06, d * 0.85] },
        // legs
        { shape: "cylinder", position: [-w * 0.4, 0.36, -d * 0.3], scale: [0.06, 0.72, 0.06], color: "#333" },
        { shape: "cylinder", position: [w * 0.4, 0.36, -d * 0.3], scale: [0.06, 0.72, 0.06], color: "#333" },
        { shape: "cylinder", position: [-w * 0.4, 0.36, d * 0.3], scale: [0.06, 0.72, 0.06], color: "#333" },
        { shape: "cylinder", position: [w * 0.4, 0.36, d * 0.3], scale: [0.06, 0.72, 0.06], color: "#333" },
      ];
    case "chair":
      return [
        { shape: "box", position: [0, 0.45, 0], scale: [0.5, 0.08, 0.5] }, // seat
        { shape: "box", position: [0, 0.75, -0.23], scale: [0.5, 0.6, 0.08] }, // backrest
        { shape: "cylinder", position: [0, 0.22, 0], scale: [0.05, 0.44, 0.05], color: "#222" }, // stem
        { shape: "cylinder", position: [0, 0.02, 0], scale: [0.32, 0.04, 0.32], color: "#222" }, // base
      ];
    case "break":
      if (item.id === "break-beanbag") {
        return [{ shape: "sphere", position: [0, 0.28, 0], scale: [0.55, 0.5, 0.55] }];
      }
      // espresso machine
      return [
        { shape: "box", position: [0, 0.35, 0], scale: [0.45, 0.5, 0.35] },
        { shape: "box", position: [0, 0.63, -0.05], scale: [0.3, 0.08, 0.2], color: "#2a2a2a" },
        { shape: "cylinder", position: [0, 0.62, 0.12], scale: [0.03, 0.15, 0.03], color: "#888" },
      ];
    case "plant":
      return [
        { shape: "cylinder", position: [0, 0.18, 0], scale: [0.22, 0.36, 0.22], color: "#8a5a3b" },
        { shape: "sphere", position: [0, 0.55, 0], scale: [0.32, 0.4, 0.32], color: "#3e7d3e" },
      ];
    case "storage": // standing whiteboard
      return [
        { shape: "box", position: [0, 0.85, 0], scale: [0.9, 0.65, 0.04], color: "#ffffff" },
        { shape: "cylinder", position: [-0.35, 0.4, 0], scale: [0.04, 0.8, 0.04], color: "#999" },
        { shape: "cylinder", position: [0.35, 0.4, 0], scale: [0.04, 0.8, 0.04], color: "#999" },
      ];
    default:
      return [{ shape: "box", position: [0, 0.25, 0], scale: [w * 0.8, 0.5, d * 0.8] }];
  }
}

/** Desk-slot items render smaller, sitting on the desk's 0.75-high tabletop. */
export function getDeskSlotRecipe(item: CatalogItem): Part[] {
  switch (item.slotType) {
    case "monitor": {
      const heightScale = item.monitor ? 0.35 + item.monitor.sizeInches / 100 : 0.5;
      return [
        { shape: "box", position: [0, heightScale / 2 + 0.05, 0], scale: [heightScale * (item.monitor?.curved ? 1.5 : 1.3), heightScale, 0.03] },
        { shape: "cylinder", position: [0, 0.02, 0], scale: [0.05, 0.05, 0.05], color: "#333" },
      ];
    }
    case "accessory":
      if (item.id === "acc-lamp") {
        return [
          { shape: "cylinder", position: [0, 0.01, 0], scale: [0.1, 0.02, 0.1], color: "#888" },
          { shape: "cylinder", position: [0, 0.2, 0], scale: [0.02, 0.4, 0.02], color: "#888" },
          { shape: "sphere", position: [0.08, 0.42, 0], scale: [0.09, 0.09, 0.09] },
        ];
      }
      if (item.id === "acc-laptop-stand") {
        return [
          { shape: "box", position: [0, 0.08, 0], scale: [0.35, 0.03, 0.25] },
          { shape: "box", position: [0, 0.2, -0.08], scale: [0.35, 0.03, 0.02], rotation: [0.5, 0, 0] },
        ];
      }
      if (item.id === "acc-keyboard") {
        return [{ shape: "box", position: [0, 0.02, 0], scale: [0.4, 0.02, 0.14] }];
      }
      // webcam
      return [
        { shape: "box", position: [0, 0.03, 0], scale: [0.1, 0.05, 0.05] },
        { shape: "cylinder", position: [0, 0.06, -0.02], scale: [0.03, 0.03, 0.03], color: "#111" },
      ];
    default:
      return [{ shape: "box", position: [0, 0.05, 0], scale: [0.2, 0.1, 0.2] }];
  }
}
