import { getCatalogItem } from "./catalog";
import type { PlacedDeskItem, PlacedFloorItem } from "./types";

export interface ComparisonRow {
  catalogId: string;
  name: string;
  qtyA: number;
  qtyB: number;
}

type HasCatalogId = { catalogId: string };

function tally(items: HasCatalogId[], into: Map<string, { a: number; b: number }>, key: "a" | "b") {
  for (const it of items) {
    const entry = into.get(it.catalogId) ?? { a: 0, b: 0 };
    entry[key] += 1;
    into.set(it.catalogId, entry);
  }
}

/**
 * Per-catalog-item quantity comparison between two designs (floor + desk
 * items combined, since "how many monitors total" matters more than where
 * they're mounted). Counting by catalogId rather than diffing instanceIds
 * means this naturally handles "2 of the same desk" instead of only
 * detecting whole-item add/remove. Rows are sorted by name for a stable,
 * scannable table regardless of placement order.
 */
export function buildComparisonRows(
  floorA: PlacedFloorItem[],
  deskA: PlacedDeskItem[],
  floorB: PlacedFloorItem[],
  deskB: PlacedDeskItem[],
): ComparisonRow[] {
  const counts = new Map<string, { a: number; b: number }>();
  tally(floorA, counts, "a");
  tally(deskA, counts, "a");
  tally(floorB, counts, "b");
  tally(deskB, counts, "b");

  const rows: ComparisonRow[] = [];
  for (const [catalogId, { a, b }] of counts) {
    const item = getCatalogItem(catalogId);
    rows.push({ catalogId, name: item?.name ?? catalogId, qtyA: a, qtyB: b });
  }

  return rows.sort((x, y) => x.name.localeCompare(y.name));
}

/** Pulls a design id out of either a bare id or a pasted /d/<id> share link. */
export function extractDesignId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/d\/([^/?#\s]+)/);
  return match ? match[1] : trimmed;
}
