import { describe, expect, it } from "vitest";
import { canPlaceOnDesk, canPlaceOnFloor } from "./rules";
import { getCatalogItem } from "./catalog";
import type { PlacedDeskItem, PlacedFloorItem } from "./types";

const deskStandard = getCatalogItem("desk-standard")!;
const deskCompact = getCatalogItem("desk-compact")!;
const deskWide = getCatalogItem("desk-wide")!;
const chair = getCatalogItem("chair-ergonomic")!;
const monitor24 = getCatalogItem("monitor-24-fhd")!;
const monitor34curved = getCatalogItem("monitor-34-curved")!;
const lamp = getCatalogItem("acc-lamp")!;
const laptopStand = getCatalogItem("acc-laptop-stand")!;
const keyboard = getCatalogItem("acc-keyboard")!;
const webcam = getCatalogItem("acc-webcam")!;

describe("canPlaceOnFloor", () => {
  it("allows placing on an empty tile", () => {
    const result = canPlaceOnFloor(chair, { x: 0, z: 0 }, 0, []);
    expect(result.valid).toBe(true);
  });

  it("rejects a desk-slot item (wrong placement kind)", () => {
    const result = canPlaceOnFloor(monitor24, { x: 0, z: 0 }, 0, []);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/doesn't go on the floor/);
  });

  it("rejects a footprint that falls outside the room on the low end", () => {
    const result = canPlaceOnFloor(chair, { x: -1, z: 0 }, 0, []);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("That's outside the room.");
  });

  it("rejects a footprint that falls outside the room on the high end", () => {
    // desk-standard is 2 wide; room is 8 tiles wide (x: 0..7)
    const result = canPlaceOnFloor(deskStandard, { x: 7, z: 0 }, 0, []);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("That's outside the room.");
  });

  it("accounts for rotation when checking room bounds", () => {
    // desk-wide is 3x1; rotated 90 it becomes 1x3, which fits depth 6 at z=5.. only 1 cell (5), so still in bounds
    const rotatedOk = canPlaceOnFloor(deskWide, { x: 0, z: 3 }, 90, []);
    expect(rotatedOk.valid).toBe(true);
    // but placing the unrotated 3-wide desk at x=6 goes out of bounds (needs x=6,7,8)
    const unrotatedOutOfBounds = canPlaceOnFloor(deskWide, { x: 6, z: 0 }, 0, []);
    expect(unrotatedOutOfBounds.valid).toBe(false);
  });

  it("rejects overlapping an existing item", () => {
    const existing: PlacedFloorItem[] = [
      { instanceId: "a", catalogId: "chair-ergonomic", position: { x: 2, z: 2 }, rotationY: 0 },
    ];
    const result = canPlaceOnFloor(chair, { x: 2, z: 2 }, 0, existing);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/already taken/);
  });

  it("allows placing next to (not overlapping) an existing item", () => {
    const existing: PlacedFloorItem[] = [
      { instanceId: "a", catalogId: "chair-ergonomic", position: { x: 2, z: 2 }, rotationY: 0 },
    ];
    const result = canPlaceOnFloor(chair, { x: 3, z: 2 }, 0, existing);
    expect(result.valid).toBe(true);
  });

  it("ignores the instance passed as ignoreInstanceId (used for rotate/move in place)", () => {
    const existing: PlacedFloorItem[] = [
      { instanceId: "self", catalogId: "desk-standard", position: { x: 2, z: 2 }, rotationY: 0 },
    ];
    // Rotating in place would otherwise "overlap itself" — ignoreInstanceId prevents that false negative.
    const result = canPlaceOnFloor(deskStandard, { x: 2, z: 2 }, 90, existing, "self");
    expect(result.valid).toBe(true);
  });

  it("still rejects overlap with a *different* existing instance even when ignoreInstanceId is set", () => {
    const existing: PlacedFloorItem[] = [
      { instanceId: "self", catalogId: "chair-ergonomic", position: { x: 2, z: 2 }, rotationY: 0 },
      { instanceId: "other", catalogId: "chair-ergonomic", position: { x: 3, z: 2 }, rotationY: 0 },
    ];
    const result = canPlaceOnFloor(chair, { x: 3, z: 2 }, 0, existing, "self");
    expect(result.valid).toBe(false);
  });

  it("treats an item with no footprint as occupying a single tile", () => {
    const noFootprintItem = { ...chair, footprint: undefined };
    const result = canPlaceOnFloor(noFootprintItem, { x: 0, z: 0 }, 0, []);
    expect(result.valid).toBe(true);
  });

  it("skips an existing entry whose catalogId no longer resolves (defensive, e.g. stale data)", () => {
    const existing: PlacedFloorItem[] = [
      { instanceId: "stale", catalogId: "no-longer-in-catalog", position: { x: 0, z: 0 }, rotationY: 0 },
    ];
    const result = canPlaceOnFloor(chair, { x: 0, z: 0 }, 0, existing);
    expect(result.valid).toBe(true);
  });
});

describe("canPlaceOnDesk", () => {
  const desk: PlacedFloorItem = {
    instanceId: "desk-1",
    catalogId: "desk-standard",
    position: { x: 0, z: 0 },
    rotationY: 0,
  };

  it("rejects a floor item (wrong placement kind)", () => {
    const result = canPlaceOnDesk(chair, desk, []);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/doesn't go on a desk/);
  });

  it("rejects when the floor item passed isn't actually a desk", () => {
    const notADesk: PlacedFloorItem = { ...desk, catalogId: "chair-ergonomic" };
    const result = canPlaceOnDesk(monitor24, notADesk, []);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("That's not a desk.");
  });

  it("allows a monitor when under the desk's max monitor count", () => {
    const result = canPlaceOnDesk(monitor24, desk, []);
    expect(result.valid).toBe(true);
  });

  it("rejects a monitor once the desk's monitor slots are full", () => {
    const existing: PlacedDeskItem[] = [
      { instanceId: "m1", catalogId: "monitor-24-fhd", deskInstanceId: "desk-1", slotIndex: 0 },
      { instanceId: "m2", catalogId: "monitor-24-fhd", deskInstanceId: "desk-1", slotIndex: 1 },
    ];
    // desk-standard maxMonitors is 2
    const result = canPlaceOnDesk(monitor24, desk, existing);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/only fits 2 monitors/);
  });

  it("uses singular 'monitor' in the message when the desk only fits one", () => {
    const compactDesk: PlacedFloorItem = { ...desk, catalogId: "desk-compact" }; // maxMonitors: 1
    const existing: PlacedDeskItem[] = [
      { instanceId: "m1", catalogId: "monitor-24-fhd", deskInstanceId: "desk-1", slotIndex: 0 },
    ];
    const result = canPlaceOnDesk(monitor24, compactDesk, existing);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/only fits 1 monitor\./);
  });

  it("rejects a monitor that needs a wider desk than this one", () => {
    // desk-standard is 140cm; the 34\" curved monitor needs >=140cm — exactly at the boundary it should pass
    const compactDesk: PlacedFloorItem = { ...desk, catalogId: "desk-compact" };
    const result = canPlaceOnDesk(monitor34curved, compactDesk, []);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/needs at least/);
  });

  it("allows a monitor exactly at the desk's minimum width", () => {
    const result = canPlaceOnDesk(monitor34curved, desk, []); // desk-standard is exactly 140cm
    expect(result.valid).toBe(true);
  });

  it("allows an accessory when under the desk's accessory slot count", () => {
    const result = canPlaceOnDesk(lamp, desk, []);
    expect(result.valid).toBe(true);
  });

  it("rejects an accessory once the desk's accessory slots are full", () => {
    // desk-standard has 3 accessory slots
    const existing: PlacedDeskItem[] = [
      { instanceId: "a1", catalogId: "acc-lamp", deskInstanceId: "desk-1", slotIndex: 0 },
      { instanceId: "a2", catalogId: "acc-laptop-stand", deskInstanceId: "desk-1", slotIndex: 1 },
      { instanceId: "a3", catalogId: "acc-keyboard", deskInstanceId: "desk-1", slotIndex: 2 },
    ];
    const result = canPlaceOnDesk(webcam, desk, existing);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/no free accessory slots/);
  });

  it("ignores the instance passed as ignoreInstanceId when counting slots", () => {
    const existing: PlacedDeskItem[] = [
      { instanceId: "a1", catalogId: "acc-lamp", deskInstanceId: "desk-1", slotIndex: 0 },
    ];
    // Without ignoring "a1" this desk (2 accessory slots on desk-compact) would still have room;
    // this test just confirms the ignored instance isn't double-counted against itself.
    const compactDesk: PlacedFloorItem = { ...desk, catalogId: "desk-compact" };
    const result = canPlaceOnDesk(laptopStand, compactDesk, existing, "a1");
    expect(result.valid).toBe(true);
  });

  it("keeps monitor and accessory slot counts independent", () => {
    const existing: PlacedDeskItem[] = [
      { instanceId: "m1", catalogId: "monitor-24-fhd", deskInstanceId: "desk-1", slotIndex: 0 },
      { instanceId: "m2", catalogId: "monitor-24-fhd", deskInstanceId: "desk-1", slotIndex: 1 },
    ];
    // Monitor slots are full, but accessory slots are untouched.
    const result = canPlaceOnDesk(keyboard, desk, existing);
    expect(result.valid).toBe(true);
  });
});
