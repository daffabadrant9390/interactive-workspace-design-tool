// Core domain types for the workspace designer.
// Kept in one file since the whole catalog/rules/pricing layer shares them.

export type FloorCategory =
  | "desk"
  | "chair"
  | "storage"
  | "plant"
  | "break";

export type DeskSlotCategory = "monitor" | "accessory";

export type ItemCategory = FloorCategory | DeskSlotCategory;

/** Grid footprint in floor-tile units (1 tile = 60cm to match real desk depths). */
export interface Footprint {
  w: number;
  d: number;
}

export interface DeskSpec {
  /** Real-world width in cm, used for compatibility checks (e.g. curved monitors). */
  widthCm: number;
  maxMonitors: number;
  /** Max accessory items (lamp, laptop stand, keyboard, webcam) that can sit on the desk. */
  accessorySlots: number;
}

export interface MonitorSpec {
  sizeInches: number;
  curved: boolean;
  /** Desk must be at least this wide (cm) to fit this monitor. */
  minDeskWidthCm: number;
}

/** A product as it appears in the rentable catalog. */
export interface CatalogItem {
  id: string;
  name: string;
  category: ItemCategory;
  /** Where it can be placed. Floor items live on the grid; desk-slot items live on a desk. */
  placement: "floor" | "desk-slot";
  footprint?: Footprint; // only for placement: "floor"
  slotType?: DeskSlotCategory; // only for placement: "desk-slot"
  weeklyPriceUsdCents: number;
  imageUrl?: string;
  color: string; // hex, used for the procedural 3D mesh
  description: string;
  brand?: string;
  desk?: DeskSpec;
  monitor?: MonitorSpec;
}

export interface GridPosition {
  x: number;
  z: number;
}

export interface PlacedFloorItem {
  instanceId: string;
  catalogId: string;
  position: GridPosition;
  rotationY: 0 | 90 | 180 | 270;
  /** Optional color override chosen in the preview modal; falls back to the catalog item's color. */
  color?: string;
}

export interface PlacedDeskItem {
  instanceId: string;
  catalogId: string;
  deskInstanceId: string;
  slotIndex: number;
  /** Optional color override chosen in the preview modal; falls back to the catalog item's color. */
  color?: string;
  /** Cosmetic orientation on the desk, same idea as PlacedFloorItem.rotationY. Defaults to 0. */
  rotationY?: 0 | 90 | 180 | 270;
}

export interface Design {
  id: string;
  name: string;
  floorItems: PlacedFloorItem[];
  deskItems: PlacedDeskItem[];
  durationWeeks: number;
  createdAt: string;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export interface AppliedBundle {
  id: string;
  name: string;
  discountPct: number;
  description: string;
}

export interface AdvisorSuggestion {
  message: string;
  suggestedItemIds: string[];
}
