import { describe, expect, it } from "vitest";
import { fallbackAdvise } from "./advisor-fallback";
import { getCatalogItem } from "./catalog";

function expectAllIdsExist(ids: string[]) {
  for (const id of ids) {
    expect(getCatalogItem(id), `expected "${id}" to be a real catalog id`).toBeDefined();
  }
}

describe("fallbackAdvise", () => {
  it("suggests a trading setup for trading/finance language", () => {
    const result = fallbackAdvise("I day trade stocks and watch charts all day");
    expect(result.suggestedItemIds).toContain("monitor-34-curved");
    expectAllIdsExist(result.suggestedItemIds);
  });

  it("suggests a content/call setup for video/streaming language", () => {
    const result = fallbackAdvise("I do video calls and stream content daily");
    expect(result.suggestedItemIds).toContain("acc-webcam");
    expectAllIdsExist(result.suggestedItemIds);
  });

  it("suggests an ergonomic setup for posture/health language", () => {
    const result = fallbackAdvise("I have back pain and need better ergonomics");
    expect(result.suggestedItemIds).toContain("chair-ergonomic");
    expectAllIdsExist(result.suggestedItemIds);
  });

  it("suggests a dev setup for programming language", () => {
    const result = fallbackAdvise("I'm a software engineer who codes all day");
    expect(result.suggestedItemIds).toContain("monitor-27-4k");
    expectAllIdsExist(result.suggestedItemIds);
  });

  it("falls back to a generic all-around setup when nothing matches", () => {
    const result = fallbackAdvise("I just need a nice desk");
    expect(result.suggestedItemIds).toEqual(["desk-standard", "chair-ergonomic", "monitor-24-fhd"]);
  });

  it("is case-insensitive", () => {
    const lower = fallbackAdvise("i trade stocks");
    const upper = fallbackAdvise("I TRADE STOCKS");
    expect(lower.suggestedItemIds).toEqual(upper.suggestedItemIds);
  });

  it("always returns a non-empty message", () => {
    for (const prompt of ["trading", "video calls", "back pain", "coding", "something else entirely"]) {
      expect(fallbackAdvise(prompt).message.length).toBeGreaterThan(0);
    }
  });
});
