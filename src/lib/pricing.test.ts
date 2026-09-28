import { describe, expect, it } from "vitest";
import {
  computeBundle,
  computePriceBreakdown,
  effectiveWeeklyRate,
  formatUsd,
  totalWeeksFor,
} from "./pricing";
import type { PlacedDeskItem, PlacedFloorItem } from "./types";

function floorItem(catalogId: string, instanceId = catalogId): PlacedFloorItem {
  return { instanceId, catalogId, position: { x: 0, z: 0 }, rotationY: 0 };
}

function deskItem(catalogId: string, instanceId = catalogId, deskInstanceId = "desk-1"): PlacedDeskItem {
  return { instanceId, catalogId, deskInstanceId, slotIndex: 0 };
}

describe("effectiveWeeklyRate", () => {
  it("returns the base rate unchanged for weekly billing", () => {
    expect(effectiveWeeklyRate(1000, "week")).toBe(1000);
  });

  it("applies the monthly discount for monthly billing", () => {
    expect(effectiveWeeklyRate(1000, "month")).toBe(700);
  });

  it("rounds the discounted monthly rate", () => {
    expect(effectiveWeeklyRate(999, "month")).toBe(Math.round(999 * 0.7));
  });
});

describe("totalWeeksFor", () => {
  it("returns cycles directly for weekly billing", () => {
    expect(totalWeeksFor("week", 3)).toBe(3);
  });

  it("multiplies cycles by weeks-per-month for monthly billing", () => {
    expect(totalWeeksFor("month", 2)).toBe(8);
  });
});

describe("computeBundle", () => {
  it("returns null when nothing qualifies", () => {
    const bundle = computeBundle([floorItem("break-plant")], []);
    expect(bundle).toBeNull();
  });

  it("detects the Essentials bundle (desk + chair)", () => {
    const bundle = computeBundle([floorItem("desk-standard"), floorItem("chair-ergonomic")], []);
    expect(bundle?.id).toBe("essentials");
  });

  it("detects the Creator Setup bundle (webcam + lamp + laptop stand)", () => {
    const bundle = computeBundle(
      [],
      [deskItem("acc-webcam", "w"), deskItem("acc-lamp", "l"), deskItem("acc-laptop-stand", "s")],
    );
    expect(bundle?.id).toBe("creator-corner");
  });

  it("prefers the Trading Setup over Essentials when both qualify", () => {
    const bundle = computeBundle(
      [floorItem("desk-wide"), floorItem("chair-executive")],
      [deskItem("monitor-34-curved")],
    );
    expect(bundle?.id).toBe("trading-setup");
  });

  it("prefers Trading Setup over Creator Setup when both technically qualify", () => {
    const bundle = computeBundle(
      [floorItem("desk-wide"), floorItem("chair-executive")],
      [
        deskItem("monitor-34-curved", "m"),
        deskItem("acc-webcam", "w"),
        deskItem("acc-lamp", "l"),
        deskItem("acc-laptop-stand", "s"),
      ],
    );
    expect(bundle?.id).toBe("trading-setup");
  });

  it("ignores unknown catalog ids gracefully", () => {
    const bundle = computeBundle([floorItem("not-a-real-id")], []);
    expect(bundle).toBeNull();
  });
});

describe("computePriceBreakdown", () => {
  it("computes a simple weekly breakdown with no bundle", () => {
    const breakdown = computePriceBreakdown([floorItem("break-plant")], [], "week", 2);
    expect(breakdown.appliedBundle).toBeNull();
    expect(breakdown.lines).toHaveLength(1);
    expect(breakdown.weeklySubtotalCents).toBe(200); // break-plant is 200c/week
    expect(breakdown.totalWeeks).toBe(2);
    expect(breakdown.grandTotalCents).toBe(400);
  });

  it("applies the bundle discount to every line", () => {
    const breakdown = computePriceBreakdown(
      [floorItem("desk-standard"), floorItem("chair-ergonomic")],
      [],
      "week",
      1,
    );
    expect(breakdown.appliedBundle?.id).toBe("essentials");
    for (const line of breakdown.lines) {
      expect(line.bundleId).toBe("essentials");
      expect(line.discountedWeeklyCents).toBeLessThan(line.baseWeeklyCents);
    }
  });

  it("combines the monthly rate discount with a bundle discount and totals correctly", () => {
    const breakdown = computePriceBreakdown(
      [floorItem("desk-standard"), floorItem("chair-ergonomic")],
      [],
      "month",
      1,
    );
    // desk-standard 1800c, chair-ergonomic 1500c
    const deskMonthly = effectiveWeeklyRate(1800, "month");
    const chairMonthly = effectiveWeeklyRate(1500, "month");
    const bundleMultiplier = 1 - 10 / 100; // essentials
    const expectedSubtotal =
      Math.round(deskMonthly * bundleMultiplier) + Math.round(chairMonthly * bundleMultiplier);
    expect(breakdown.weeklySubtotalCents).toBe(expectedSubtotal);
    expect(breakdown.totalWeeks).toBe(4);
    expect(breakdown.grandTotalCents).toBe(expectedSubtotal * 4);
  });

  it("includes desk-slot item lines alongside floor item lines", () => {
    const breakdown = computePriceBreakdown(
      [floorItem("desk-standard")],
      [deskItem("acc-lamp")],
      "week",
      1,
    );
    expect(breakdown.lines.map((l) => l.catalogId).sort()).toEqual(["acc-lamp", "desk-standard"]);
    expect(breakdown.weeklySubtotalCents).toBe(1800 + 400);
  });

  it("skips lines for unknown catalog ids on the floor and desk", () => {
    const breakdown = computePriceBreakdown(
      [floorItem("bogus-floor-id")],
      [deskItem("bogus-desk-id")],
      "week",
      1,
    );
    expect(breakdown.lines).toHaveLength(0);
    expect(breakdown.weeklySubtotalCents).toBe(0);
  });

  it("returns an empty breakdown for an empty room", () => {
    const breakdown = computePriceBreakdown([], [], "week", 1);
    expect(breakdown.lines).toHaveLength(0);
    expect(breakdown.appliedBundle).toBeNull();
    expect(breakdown.grandTotalCents).toBe(0);
  });
});

describe("formatUsd", () => {
  it("formats whole dollars", () => {
    expect(formatUsd(1500)).toBe("$15.00");
  });

  it("formats zero", () => {
    expect(formatUsd(0)).toBe("$0.00");
  });

  it("formats cents that aren't a whole dollar amount", () => {
    expect(formatUsd(999)).toBe("$9.99");
  });
});
