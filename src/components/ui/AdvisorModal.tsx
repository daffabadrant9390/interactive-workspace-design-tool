"use client";

import { useMemo, useState } from "react";
import { getCatalogItem } from "@/lib/catalog";
import { detectCurrencyHint, formatCurrency, USD_TO_IDR_RATE } from "@/lib/currency";
import { useDesignStore } from "@/store/design-store";
import { useUiStore } from "@/store/ui-store";
import { ItemThumbnail } from "./ItemThumbnail";

interface AdvisorResponse {
  message: string;
  suggestedItemIds: string[];
  estimatedWeeklyCents?: number;
  budgetWeeklyCents?: number | null;
  trimmedForBudget?: boolean;
  source?: "ai" | "fallback";
}

/**
 * The AI advisor, as its own popup instead of a strip glued to the top of the
 * 3D view. Ask a question, optionally give it a weekly budget, see the
 * suggestion (with real thumbnails and an estimated total) right here, then
 * either apply it to the room or cancel — nothing changes in the room until
 * you explicitly click "Add these to my room".
 */
export function AdvisorModal({ onClose }: { onClose: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdvisorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const applySuggestedItems = useDesignStore((s) => s.applySuggestedItems);
  const currency = useUiStore((s) => s.currency);

  // What the prompt text itself says ("...500000 rupiah...", "...$50...") wins
  // over the header's USD/IDR toggle when they disagree — someone typing a
  // budget in words almost certainly means it literally, regardless of
  // whatever the rest of the app happens to be displaying in right now.
  const currencyHint = useMemo(() => detectCurrencyHint(prompt), [prompt]);
  const budgetCurrency = currencyHint ?? currency;

  async function handleAsk() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const budgetNum = Number(budgetInput);
      const hasBudget = budgetInput.trim() !== "" && Number.isFinite(budgetNum) && budgetNum > 0;
      // The catalog/advisor are USD-native; convert a budget typed in IDR back to USD before sending.
      const weeklyBudgetUsd = hasBudget
        ? budgetCurrency === "IDR"
          ? budgetNum / USD_TO_IDR_RATE
          : budgetNum
        : undefined;

      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, weeklyBudgetUsd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "The advisor is unavailable right now.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!result) return;
    applySuggestedItems(result.suggestedItemIds);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl border border-border bg-surface p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">✨ Ask AI for a starting point</h2>
            <p className="text-xs text-muted">Describe how you work, get a suggested setup.</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-muted hover:bg-surface-2 hover:text-foreground"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder='e.g. "I trade stocks and need 2 screens"'
            className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <label className="shrink-0 text-xs text-muted" htmlFor="advisor-budget">
            Weekly budget ({budgetCurrency}, optional)
          </label>
          <input
            id="advisor-budget"
            type="number"
            min={0}
            inputMode="decimal"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder={budgetCurrency === "IDR" ? "mis. 500000" : "e.g. 50"}
            className="w-28 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={handleAsk}
            disabled={loading || !prompt.trim()}
            className="ml-auto shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-40"
          >
            {loading ? "Thinking…" : "Ask"}
          </button>
        </div>

        {currencyHint !== null && currencyHint !== currency && (
          <p className="mt-1 text-[10px] text-muted">
            Detected {currencyHint} in your prompt — using that for the budget field above.
          </p>
        )}

        {error && <p className="mt-2 text-xs text-invalid">{error}</p>}

        {result && (
          <div className="mt-3 flex-1 space-y-2 overflow-y-auto rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs">
            <p>{result.message}</p>
            <div className="flex flex-wrap gap-2">
              {result.suggestedItemIds.map((id, i) => {
                const item = getCatalogItem(id);
                if (!item) return null;
                return (
                  <div
                    key={`${id}-${i}`}
                    className="flex items-center gap-1.5 rounded-full bg-surface-2 py-1 pl-1 pr-2.5"
                  >
                    <ItemThumbnail item={item} size={22} className="overflow-hidden rounded-full" />
                    <span>{item.name}</span>
                  </div>
                );
              })}
            </div>

            {typeof result.estimatedWeeklyCents === "number" && (
              <p className="font-semibold text-accent">
                Estimated total: {formatCurrency(result.estimatedWeeklyCents, currency)}/week
                {result.budgetWeeklyCents ? (
                  <span className="font-normal text-muted">
                    {" "}
                    (budget: {formatCurrency(result.budgetWeeklyCents, currency)}/week)
                  </span>
                ) : null}
              </p>
            )}
            {result.trimmedForBudget && (
              <p className="text-[10px] text-muted">
                Trimmed some lower-priority items to fit your budget.
              </p>
            )}
            {result.source === "fallback" && (
              <p className="text-[10px] text-muted">
                (Using rule-based suggestions — AI advisor is unavailable right now.)
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!result}
            className="flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add these to my room
          </button>
        </div>
      </div>
    </div>
  );
}
