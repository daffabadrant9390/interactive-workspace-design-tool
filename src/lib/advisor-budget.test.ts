import { describe, expect, it } from "vitest";
import { applyBudgetConstraint } from "./advisor-budget";

// desk-standard: 1800, chair-ergonomic: 1500, monitor-24-fhd: 800, acc-lamp: 400

describe("applyBudgetConstraint", () => {
  it("keeps everything and sums the total when no budget is given", () => {
    const result = applyBudgetConstraint(["desk-standard", "chair-ergonomic"], undefined);
    expect(result.itemIds).toEqual(["desk-standard", "chair-ergonomic"]);
    expect(result.estimatedWeeklyCents).toBe(1800 + 1500);
    expect(result.trimmed).toBe(false);
  });

  it("drops unknown catalog ids even with no budget set", () => {
    const result = applyBudgetConstraint(["desk-standard", "not-a-real-id"], undefined);
    expect(result.itemIds).toEqual(["desk-standard"]);
  });

  it("keeps the full list when it already fits the budget", () => {
    const result = applyBudgetConstraint(["desk-standard", "chair-ergonomic"], 5000);
    expect(result.itemIds).toEqual(["desk-standard", "chair-ergonomic"]);
    expect(result.trimmed).toBe(false);
  });

  it("trims from the tail once the running total would exceed budget", () => {
    // 1800 + 1500 = 3300 (fits a 3500 budget), + 800 monitor = 4100 (doesn't fit)
    const result = applyBudgetConstraint(
      ["desk-standard", "chair-ergonomic", "monitor-24-fhd", "acc-lamp"],
      3500,
    );
    expect(result.itemIds).toEqual(["desk-standard", "chair-ergonomic"]);
    expect(result.estimatedWeeklyCents).toBe(3300);
    expect(result.trimmed).toBe(true);
  });

  it("still keeps the first item even when it alone exceeds the budget", () => {
    const result = applyBudgetConstraint(["desk-standard"], 100);
    expect(result.itemIds).toEqual(["desk-standard"]);
    expect(result.estimatedWeeklyCents).toBe(1800);
    expect(result.trimmed).toBe(false);
  });

  it("treats a zero or negative budget as no budget", () => {
    const result = applyBudgetConstraint(["desk-standard", "chair-ergonomic"], 0);
    expect(result.itemIds).toEqual(["desk-standard", "chair-ergonomic"]);
    expect(result.trimmed).toBe(false);
  });
});
