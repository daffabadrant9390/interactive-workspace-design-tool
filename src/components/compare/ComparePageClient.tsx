"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { computePriceBreakdown, type DurationOption } from "@/lib/pricing";
import { formatCurrency } from "@/lib/currency";
import { buildComparisonRows, extractDesignId } from "@/lib/compare";
import { useUiStore } from "@/store/ui-store";
import type { PlacedDeskItem, PlacedFloorItem } from "@/lib/types";

interface DesignRow {
  id: string;
  name: string;
  floorItems: PlacedFloorItem[];
  deskItems: PlacedDeskItem[];
  duration: DurationOption;
  cycles: number;
}

async function fetchDesign(id: string): Promise<DesignRow> {
  const res = await fetch(`/api/designs/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Couldn't load design "${id}" — check the link or ID.`);
  return res.json();
}

function SetupColumn({
  label,
  design,
  currency,
}: {
  label: string;
  design: DesignRow;
  currency: "USD" | "IDR";
}) {
  const breakdown = computePriceBreakdown(design.floorItems, design.deskItems, design.duration, design.cycles);
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <h2 className="mt-0.5 truncate text-sm font-semibold">{design.name || "Untitled workspace"}</h2>

      <ul className="mt-3 space-y-1.5 text-sm">
        {breakdown.lines.map((line) => (
          <li key={line.instanceId} className="flex items-center justify-between gap-2">
            <span className="truncate">{line.name}</span>
            <span className="shrink-0 font-medium text-accent">
              {formatCurrency(line.discountedWeeklyCents, currency)}/wk
            </span>
          </li>
        ))}
        {breakdown.lines.length === 0 && <li className="text-muted">Nothing in this setup yet.</li>}
      </ul>

      {breakdown.appliedBundle && (
        <p className="mt-3 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs text-accent">
          🎉 Qualifies for <strong>{breakdown.appliedBundle.name}</strong> — {breakdown.appliedBundle.discountPct}%
          off
        </p>
      )}

      <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
        <div className="flex items-center justify-between text-muted">
          <span>Weekly subtotal</span>
          <span>{formatCurrency(breakdown.weeklySubtotalCents, currency)}</span>
        </div>
        <div className="flex items-center justify-between font-semibold">
          <span>Total ({breakdown.totalWeeks} weeks)</span>
          <span>{formatCurrency(breakdown.grandTotalCents, currency)}</span>
        </div>
      </div>
    </div>
  );
}

export function ComparePageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currency = useUiStore((s) => s.currency);

  const [inputA, setInputA] = useState(searchParams.get("a") ?? "");
  const [inputB, setInputB] = useState(searchParams.get("b") ?? "");
  const [designA, setDesignA] = useState<DesignRow | null>(null);
  const [designB, setDesignB] = useState<DesignRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    useUiStore.persist.rehydrate();
  }, []);

  async function handleCompare(a = inputA, b = inputB) {
    const idA = extractDesignId(a);
    const idB = extractDesignId(b);
    if (!idA || !idB) {
      setError("Paste two design links or IDs to compare.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [resultA, resultB] = await Promise.all([fetchDesign(idA), fetchDesign(idB)]);
      setDesignA(resultA);
      setDesignB(resultB);
      router.replace(`/compare?a=${encodeURIComponent(idA)}&b=${encodeURIComponent(idB)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load one of those designs.");
      setDesignA(null);
      setDesignB(null);
    } finally {
      setLoading(false);
    }
  }

  // Auto-run once if both ids arrived via the URL (e.g. a shared compare link).
  useEffect(() => {
    const a = searchParams.get("a");
    const b = searchParams.get("b");
    if (a && b) handleCompare(a, b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows =
    designA && designB ? buildComparisonRows(designA.floorItems, designA.deskItems, designB.floorItems, designB.deskItems) : [];

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Compare Setups <span className="text-muted">· CiptaForge</span>
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              Paste two shareable design links (or just their IDs) to compare items and price side by side.
            </p>
          </div>
          <Link href="/design" className="shrink-0 text-sm font-semibold text-accent underline">
            ← Back to designer
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={inputA}
            onChange={(e) => setInputA(e.target.value)}
            placeholder="Setup A — paste link or ID"
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            value={inputB}
            onChange={(e) => setInputB(e.target.value)}
            placeholder="Setup B — paste link or ID"
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <button
          onClick={() => handleCompare()}
          disabled={loading || !inputA.trim() || !inputB.trim()}
          className="mt-3 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Comparing…" : "Compare"}
        </button>

        {error && <p className="mt-3 text-sm text-invalid">{error}</p>}

        {designA && designB && (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <SetupColumn label="Setup A" design={designA} currency={currency} />
              <SetupColumn label="Setup B" design={designB} currency={currency} />
            </div>

            {rows.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-3 py-2 font-medium">Item</th>
                      <th className="px-3 py-2 text-right font-medium">Setup A</th>
                      <th className="px-3 py-2 text-right font-medium">Setup B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.catalogId} className="border-t border-border">
                        <td className="px-3 py-2">{row.name}</td>
                        <td
                          className={
                            "px-3 py-2 text-right " + (row.qtyA !== row.qtyB ? "font-semibold text-accent" : "")
                          }
                        >
                          {row.qtyA}
                        </td>
                        <td
                          className={
                            "px-3 py-2 text-right " + (row.qtyA !== row.qtyB ? "font-semibold text-accent" : "")
                          }
                        >
                          {row.qtyB}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
