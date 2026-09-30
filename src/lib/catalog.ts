import type { CatalogItem } from "./types";

/**
 * Seed catalog, styled after a typical furniture-rental brand's categories
 * (desks, chairs, monitors, office accessories) plus a small "break corner"
 * pulled from the brief's sketch (coffee, lounge). Prices are ILLUSTRATIVE
 * placeholders made up for this demo, so these exist only to make the
 * checkout flow demonstrable. See README.
 */
export const CATALOG: CatalogItem[] = [
  // ---- Desks (floor, 2 tiles wide) ----
  {
    id: "desk-compact",
    name: "Compact Desk (110x60cm)",
    category: "desk",
    placement: "floor",
    footprint: { w: 2, d: 1 },
    weeklyPriceUsdCents: 1200,
    color: "#c9a679",
    description: "Space-saving desk, ideal for a laptop or a single monitor.",
    brand: "CiptaForge",
    desk: { widthCm: 110, maxMonitors: 1, accessorySlots: 2 },
  },
  {
    id: "desk-standard",
    name: "Standard Adjustable Desk (140x60cm)",
    category: "desk",
    placement: "floor",
    footprint: { w: 2, d: 1 },
    weeklyPriceUsdCents: 1800,
    color: "#b98d5f",
    description: "Electric sit-stand desk with room for a dual-monitor setup.",
    brand: "CiptaForge",
    desk: { widthCm: 140, maxMonitors: 2, accessorySlots: 3 },
  },
  {
    id: "desk-wide",
    name: "Wide Pro Desk (160x70cm)",
    category: "desk",
    placement: "floor",
    footprint: { w: 3, d: 1 },
    weeklyPriceUsdCents: 2200,
    color: "#8a5a3b",
    description: "Dual-motor standing desk built for ultrawide monitors and full rigs.",
    brand: "CiptaForge",
    desk: { widthCm: 160, maxMonitors: 2, accessorySlots: 4 },
  },

  // ---- Chairs (floor, 1 tile) ----
  {
    id: "chair-ergonomic",
    name: "Ergonomic Mesh Chair",
    category: "chair",
    placement: "floor",
    footprint: { w: 1, d: 1 },
    weeklyPriceUsdCents: 1500,
    color: "#2b2b2b",
    description: "Breathable mesh back, 4D armrests, adjustable lumbar support.",
    brand: "Fantech",
  },
  {
    id: "chair-executive",
    name: "Executive Recline Chair",
    category: "chair",
    placement: "floor",
    footprint: { w: 1, d: 1 },
    weeklyPriceUsdCents: 2000,
    color: "#4a3728",
    description: "Padded leatherette chair with deep recline and headrest.",
  },

  // ---- Monitors (desk-slot) ----
  {
    id: "monitor-24-fhd",
    name: '24" Full HD Monitor',
    category: "monitor",
    placement: "desk-slot",
    slotType: "monitor",
    weeklyPriceUsdCents: 800,
    color: "#1a1a1a",
    description: "144Hz IPS panel, great for everyday work.",
    monitor: { sizeInches: 24, curved: false, minDeskWidthCm: 100 },
  },
  {
    id: "monitor-27-4k",
    name: '27" 4K Monitor',
    category: "monitor",
    placement: "desk-slot",
    slotType: "monitor",
    weeklyPriceUsdCents: 1400,
    color: "#151515",
    description: "Crisp 4K IPS display with USB-C connectivity.",
    monitor: { sizeInches: 27, curved: false, minDeskWidthCm: 110 },
  },
  {
    id: "monitor-34-curved",
    name: '34" Curved Ultrawide',
    category: "monitor",
    placement: "desk-slot",
    slotType: "monitor",
    weeklyPriceUsdCents: 2000,
    color: "#101010",
    description: "180Hz curved gaming/trading monitor. Needs a wide desk.",
    monitor: { sizeInches: 34, curved: true, minDeskWidthCm: 140 },
  },

  // ---- Desk accessories (desk-slot) ----
  {
    id: "acc-lamp",
    name: "Smart LED Desk Lamp",
    category: "accessory",
    placement: "desk-slot",
    slotType: "accessory",
    weeklyPriceUsdCents: 400,
    color: "#e8e8e8",
    description: "Wi-Fi dimmable lamp, 4 lighting modes.",
  },
  {
    id: "acc-laptop-stand",
    name: "Ergonomic Laptop Stand",
    category: "accessory",
    placement: "desk-slot",
    slotType: "accessory",
    weeklyPriceUsdCents: 300,
    color: "#9a9a9a",
    description: "Raises and angles a laptop for a healthier neck position.",
  },
  {
    id: "acc-keyboard",
    name: "Wireless Keyboard",
    category: "accessory",
    placement: "desk-slot",
    slotType: "accessory",
    weeklyPriceUsdCents: 350,
    color: "#dcdcdc",
    description: "Quiet-touch wireless keyboard, multi-device pairing.",
  },
  {
    id: "acc-webcam",
    name: "4K Webcam",
    category: "accessory",
    placement: "desk-slot",
    slotType: "accessory",
    weeklyPriceUsdCents: 500,
    color: "#333333",
    description: "4K/30fps webcam with noise-canceling mic, great for calls.",
  },

  // ---- Break corner (floor, from the brief's sketch) ----
  {
    id: "break-beanbag",
    name: "Bean Bag",
    category: "break",
    placement: "floor",
    footprint: { w: 1, d: 1 },
    weeklyPriceUsdCents: 600,
    color: "#3f6b8f",
    description: "A soft corner to decompress between meetings.",
  },
  {
    id: "break-coffee",
    name: "Espresso Machine",
    category: "break",
    placement: "floor",
    footprint: { w: 1, d: 1 },
    weeklyPriceUsdCents: 1000,
    color: "#5c3a21",
    description: "19-bar espresso machine for the home-office coffee run.",
  },
  {
    id: "break-plant",
    name: "Potted Plant",
    category: "plant",
    placement: "floor",
    footprint: { w: 1, d: 1 },
    weeklyPriceUsdCents: 200,
    color: "#3e7d3e",
    description: "A bit of green life for the corner of your setup.",
  },
  {
    id: "break-whiteboard",
    name: "Standing Whiteboard",
    category: "storage",
    placement: "floor",
    footprint: { w: 1, d: 1 },
    weeklyPriceUsdCents: 500,
    color: "#f2f2f2",
    description: "Magnetic whiteboard on a stand, great for planning sessions.",
  },
];

export const CATALOG_BY_ID: Record<string, CatalogItem> = Object.fromEntries(
  CATALOG.map((item) => [item.id, item]),
);

export function getCatalogItem(id: string): CatalogItem | undefined {
  return CATALOG_BY_ID[id];
}

export const FLOOR_CATEGORIES = ["desk", "chair", "break", "plant", "storage"] as const;
export const DESK_SLOT_CATEGORIES = ["monitor", "accessory"] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  desk: "Desks",
  chair: "Chairs",
  monitor: "Monitors",
  accessory: "Accessories",
  break: "Break Corner",
  plant: "Plants",
  storage: "Storage",
};

/** Grid room size, in tiles. */
export const ROOM_WIDTH = 8;
export const ROOM_DEPTH = 6;
export const TILE_SIZE = 1; // three.js units per tile
/** One floor tile represents this many real-world centimeters (matches a typical desk depth). */
export const CM_PER_TILE = 60;

/** A small curated palette offered in the preview modal, in addition to each item's own color. */
export const COLOR_PALETTE = [
  "#111827",
  "#4b5563",
  "#b45309",
  "#0f766e",
  "#1d4ed8",
  "#7c3aed",
  "#be123c",
  "#f5f5f4",
];
