import { describe, expect, it } from "vitest";
import { buildComparisonRows, extractDesignId } from "./compare";
import type { PlacedDeskItem, PlacedFloorItem } from "./types";

function floor(catalogId: string, instanceId: string): PlacedFloorItem {
  return { instanceId, catalogId, position: { x: 0, z: 0 }, rotationY: 0 };
}
function desk(catalogId: string, instanceId: string): PlacedDeskItem {
  return { instanceId, catalogId, deskInstanceId: "desk-1", slotIndex: 0 };
}

describe("buildComparisonRows", () => {
  it("counts quantity per catalog item on each side", () => {
    const rows = buildComparisonRows(
      [floor("desk-standard", "f1"), floor("chair-ergonomic", "f2")],
      [desk("monitor-24-fhd", "d1")],
      [floor("desk-standard", "f3")],
      [desk("monitor-24-fhd", "d2"), desk("monitor-24-fhd", "d3")],
    );

    const desks = rows.find((r) => r.catalogId === "desk-standard");
    expect(desks).toEqual({
      catalogId: "desk-standard",
      name: "Standard Adjustable Desk (140x60cm)",
      qtyA: 1,
      qtyB: 1,
    });

    const monitors = rows.find((r) => r.catalogId === "monitor-24-fhd");
    expect(monitors?.qtyA).toBe(1);
    expect(monitors?.qtyB).toBe(2);

    const chair = rows.find((r) => r.catalogId === "chair-ergonomic");
    expect(chair?.qtyA).toBe(1);
    expect(chair?.qtyB).toBe(0);
  });

  it("returns an empty list for two empty designs", () => {
    expect(buildComparisonRows([], [], [], [])).toEqual([]);
  });

  it("falls back to the raw id for an unknown catalog item", () => {
    const rows = buildComparisonRows([floor("ghost-item", "f1")], [], [], []);
    expect(rows).toEqual([{ catalogId: "ghost-item", name: "ghost-item", qtyA: 1, qtyB: 0 }]);
  });
});

describe("extractDesignId", () => {
  it("returns a bare id unchanged", () => {
    expect(extractDesignId("abc123XY")).toBe("abc123XY");
  });

  it("trims surrounding whitespace", () => {
    expect(extractDesignId("  abc123XY  ")).toBe("abc123XY");
  });

  it("pulls the id out of a full share link", () => {
    expect(extractDesignId("https://interactive-workspace-design-tool.vercel.app/d/abc123XY")).toBe("abc123XY");
  });

  it("pulls the id out of a bare path", () => {
    expect(extractDesignId("/d/abc123XY")).toBe("abc123XY");
  });

  it("stops at a trailing query string or fragment", () => {
    expect(extractDesignId("https://example.com/d/abc123XY?utm_source=x")).toBe("abc123XY");
  });
});
