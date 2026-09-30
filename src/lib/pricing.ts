import { getCatalogItem } from "./catalog";
import type { AppliedBundle, PlacedDeskItem, PlacedFloorItem } from "./types";

/** Renting by the month is about 30 percent cheaper per week, a typical discount tier for this kind of rental. */
export const MONTHLY_DISCOUNT = 0.3;
export const WEEKS_PER_MONTH = 4;

export type DurationOption = "week" | "month";

export function effectiveWeeklyRate(baseWeeklyCents: number, duration: DurationOption): number {
  if (duration === "week") return baseWeeklyCents;
  return Math.round(baseWeeklyCents * (1 - MONTHLY_DISCOUNT));
}

export function totalWeeksFor(duration: DurationOption, cycles: number): number {
  return duration === "week" ? cycles : cycles * WEEKS_PER_MONTH;
}

interface BundleRule {
  id: string;
  name: string;
  discountPct: number;
  description: string;
  test: (ctx: BundleContext) => boolean;
}

interface BundleContext {
  hasDesk: boolean;
  hasChair: boolean;
  hasCurvedMonitor: boolean;
  hasAnyMonitor: boolean;
  hasLamp: boolean;
  hasLaptopStand: boolean;
  hasWebcam: boolean;
}

const BUNDLE_RULES: BundleRule[] = [
  {
    id: "trading-setup",
    name: "The Trading Setup",
    discountPct: 20,
    description: "Curved monitor + desk + chair — built for long trading sessions.",
    test: (c) => c.hasCurvedMonitor && c.hasDesk && c.hasChair,
  },
  {
    id: "creator-corner",
    name: "The Creator Setup",
    discountPct: 15,
    description: "Webcam + lamp + laptop stand — a clean setup for calls and content.",
    test: (c) => c.hasWebcam && c.hasLamp && c.hasLaptopStand,
  },
  {
    id: "essentials",
    name: "The Essentials",
    discountPct: 10,
    description: "Desk + chair — the foundation of any home office.",
    test: (c) => c.hasDesk && c.hasChair,
  },
];

export interface PriceLine {
  instanceId: string;
  catalogId: string;
  name: string;
  baseWeeklyCents: number;
  discountedWeeklyCents: number;
  bundleId?: string;
}

export interface PriceBreakdown {
  lines: PriceLine[];
  appliedBundle: AppliedBundle | null;
  weeklySubtotalCents: number;
  totalWeeks: number;
  grandTotalCents: number;
}

export function computeBundle(
  floorItems: PlacedFloorItem[],
  deskItems: PlacedDeskItem[],
): AppliedBundle | null {
  const floorCatalog = floorItems.map((f) => getCatalogItem(f.catalogId)).filter(Boolean);
  const deskCatalog = deskItems.map((d) => getCatalogItem(d.catalogId)).filter(Boolean);

  const ctx: BundleContext = {
    hasDesk: floorCatalog.some((i) => i!.category === "desk"),
    hasChair: floorCatalog.some((i) => i!.category === "chair"),
    hasCurvedMonitor: deskCatalog.some((i) => i!.monitor?.curved),
    hasAnyMonitor: deskCatalog.some((i) => i!.category === "monitor"),
    hasLamp: deskCatalog.some((i) => i!.id === "acc-lamp"),
    hasLaptopStand: deskCatalog.some((i) => i!.id === "acc-laptop-stand"),
    hasWebcam: deskCatalog.some((i) => i!.id === "acc-webcam"),
  };

  // Rules are ordered best-discount-first, so the first match wins.
  for (const rule of BUNDLE_RULES) {
    if (rule.test(ctx)) {
      return {
        id: rule.id,
        name: rule.name,
        discountPct: rule.discountPct,
        description: rule.description,
      };
    }
  }
  return null;
}

export function computePriceBreakdown(
  floorItems: PlacedFloorItem[],
  deskItems: PlacedDeskItem[],
  duration: DurationOption,
  cycles: number,
): PriceBreakdown {
  const bundle = computeBundle(floorItems, deskItems);
  const bundleMultiplier = bundle ? 1 - bundle.discountPct / 100 : 1;

  const lines: PriceLine[] = [];

  for (const f of floorItems) {
    const item = getCatalogItem(f.catalogId);
    if (!item) continue;
    const base = effectiveWeeklyRate(item.weeklyPriceUsdCents, duration);
    lines.push({
      instanceId: f.instanceId,
      catalogId: f.catalogId,
      name: item.name,
      baseWeeklyCents: base,
      discountedWeeklyCents: Math.round(base * bundleMultiplier),
      bundleId: bundle?.id,
    });
  }

  for (const d of deskItems) {
    const item = getCatalogItem(d.catalogId);
    if (!item) continue;
    const base = effectiveWeeklyRate(item.weeklyPriceUsdCents, duration);
    lines.push({
      instanceId: d.instanceId,
      catalogId: d.catalogId,
      name: item.name,
      baseWeeklyCents: base,
      discountedWeeklyCents: Math.round(base * bundleMultiplier),
      bundleId: bundle?.id,
    });
  }

  const weeklySubtotalCents = lines.reduce((sum, l) => sum + l.discountedWeeklyCents, 0);
  const totalWeeks = totalWeeksFor(duration, cycles);
  const grandTotalCents = weeklySubtotalCents * totalWeeks;

  return { lines, appliedBundle: bundle, weeklySubtotalCents, totalWeeks, grandTotalCents };
}

export function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
