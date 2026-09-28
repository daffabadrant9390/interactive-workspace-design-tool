import { describe, expect, it } from "vitest";
import { rotatedFootprint, tileToWorldCenter, worldToTile } from "./layout";
import { getCatalogItem } from "@/lib/catalog";

const deskStandard = getCatalogItem("desk-standard")!; // footprint 2x1
const chair = getCatalogItem("chair-ergonomic")!; // footprint 1x1

describe("rotatedFootprint", () => {
  it("returns the base footprint unrotated at 0 degrees", () => {
    expect(rotatedFootprint(deskStandard, 0)).toEqual({ w: 2, d: 1 });
  });

  it("returns the base footprint unrotated at 180 degrees", () => {
    expect(rotatedFootprint(deskStandard, 180)).toEqual({ w: 2, d: 1 });
  });

  it("swaps width/depth at 90 degrees", () => {
    expect(rotatedFootprint(deskStandard, 90)).toEqual({ w: 1, d: 2 });
  });

  it("swaps width/depth at 270 degrees", () => {
    expect(rotatedFootprint(deskStandard, 270)).toEqual({ w: 1, d: 2 });
  });

  it("defaults to a 1x1 footprint when the item has none", () => {
    const noFootprint = { ...chair, footprint: undefined };
    expect(rotatedFootprint(noFootprint, 0)).toEqual({ w: 1, d: 1 });
  });
});

describe("tileToWorldCenter", () => {
  it("centers a 1x1 item half a tile in from its grid position", () => {
    const [x, z] = tileToWorldCenter({ x: 2, z: 3 }, chair, 0);
    expect(x).toBeCloseTo(2.5);
    expect(z).toBeCloseTo(3.5);
  });

  it("centers a 2x1 item using its unrotated footprint", () => {
    const [x, z] = tileToWorldCenter({ x: 0, z: 0 }, deskStandard, 0);
    expect(x).toBeCloseTo(1); // 2 tiles wide -> center at 1
    expect(z).toBeCloseTo(0.5);
  });

  it("centers a rotated 2x1 item using its rotated (swapped) bounding box", () => {
    const [x, z] = tileToWorldCenter({ x: 0, z: 0 }, deskStandard, 90);
    expect(x).toBeCloseTo(0.5);
    expect(z).toBeCloseTo(1); // now 2 tiles "deep" in world space
  });
});

describe("worldToTile", () => {
  it("floors world coordinates down to their grid cell", () => {
    expect(worldToTile(2.9, 3.1)).toEqual({ x: 2, z: 3 });
  });

  it("handles the exact tile boundary", () => {
    expect(worldToTile(2.0, 3.0)).toEqual({ x: 2, z: 3 });
  });

  it("handles the origin", () => {
    expect(worldToTile(0, 0)).toEqual({ x: 0, z: 0 });
  });
});
