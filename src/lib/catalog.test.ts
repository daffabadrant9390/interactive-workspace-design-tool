import { describe, expect, it } from "vitest";
import {
  CATALOG,
  CATALOG_BY_ID,
  CATEGORY_LABELS,
  COLOR_PALETTE,
  CM_PER_TILE,
  DESK_SLOT_CATEGORIES,
  FLOOR_CATEGORIES,
  ROOM_DEPTH,
  ROOM_WIDTH,
  TILE_SIZE,
  getCatalogItem,
} from "./catalog";

describe("catalog data integrity", () => {
  it("has at least two desks and two chairs, per the challenge brief", () => {
    expect(CATALOG.filter((i) => i.category === "desk").length).toBeGreaterThanOrEqual(2);
    expect(CATALOG.filter((i) => i.category === "chair").length).toBeGreaterThanOrEqual(2);
  });

  it("gives every catalog item a unique id", () => {
    const ids = CATALOG.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every floor item a footprint and every desk-slot item none", () => {
    for (const item of CATALOG) {
      if (item.placement === "floor") {
        expect(item.footprint).toBeDefined();
      } else {
        expect(item.footprint).toBeUndefined();
      }
    }
  });

  it("gives every desk a desk spec and every non-desk no desk spec", () => {
    for (const item of CATALOG) {
      if (item.category === "desk") {
        expect(item.desk).toBeDefined();
      } else {
        expect(item.desk).toBeUndefined();
      }
    }
  });

  it("prices everything with a positive weekly rate", () => {
    for (const item of CATALOG) {
      expect(item.weeklyPriceUsdCents).toBeGreaterThan(0);
    }
  });
});

describe("getCatalogItem / CATALOG_BY_ID", () => {
  it("finds a known item by id", () => {
    expect(getCatalogItem("desk-standard")?.name).toBe("Standard Adjustable Desk (140x60cm)");
  });

  it("returns undefined for an unknown id", () => {
    expect(getCatalogItem("does-not-exist")).toBeUndefined();
  });

  it("keeps CATALOG_BY_ID in sync with CATALOG", () => {
    expect(Object.keys(CATALOG_BY_ID)).toHaveLength(CATALOG.length);
    for (const item of CATALOG) {
      expect(CATALOG_BY_ID[item.id]).toBe(item);
    }
  });
});

describe("constants", () => {
  it("defines a positive room size and tile size", () => {
    expect(ROOM_WIDTH).toBeGreaterThan(0);
    expect(ROOM_DEPTH).toBeGreaterThan(0);
    expect(TILE_SIZE).toBeGreaterThan(0);
    expect(CM_PER_TILE).toBeGreaterThan(0);
  });

  it("labels every floor and desk-slot category", () => {
    for (const cat of [...FLOOR_CATEGORIES, ...DESK_SLOT_CATEGORIES]) {
      expect(CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });

  it("offers a non-empty, deduped color palette", () => {
    expect(COLOR_PALETTE.length).toBeGreaterThan(0);
    expect(new Set(COLOR_PALETTE).size).toBe(COLOR_PALETTE.length);
  });
});
