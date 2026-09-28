"use client";

import { useState } from "react";
import { getCatalogItem } from "@/lib/catalog";
import { useDesignStore } from "@/store/design-store";
import { ItemThumbnail } from "./ItemThumbnail";

interface AdvisorResponse {
  message: string;
  suggestedItemIds: string[];
  source?: "ai" | "fallback";
}

/**
 * The AI advisor, as its own popup instead of a strip glued to the top of the
 * 3D view. Ask a question, see the suggestion (with real thumbnails) right
 * here, then either apply it to the room or cancel — nothing changes in the
 * room until you explicitly click "Add these to my room".
 */
export function AdvisorModal({ onClose }: { onClose: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdvisorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const applySuggestedItems = useDesignStore((s) => s.applySuggestedItems);

  async function handleAsk() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
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
          <button
            onClick={handleAsk}
            disabled={loading || !prompt.trim()}
            className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-40"
          >
            {loading ? "Thinking…" : "Ask"}
          </button>
        </div>

        {error && <p className="mt-2 text-xs text-invalid">{error}</p>}

        {result && (
          <div className="mt-3 flex-1 space-y-2 overflow-y-auto rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs">
            <p>{result.message}</p>
            <div className="flex flex-wrap gap-2">
              {result.suggestedItemIds.map((id) => {
                const item = getCatalogItem(id);
                if (!item) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-1.5 rounded-full bg-surface-2 py-1 pl-1 pr-2.5"
                  >
                    <ItemThumbnail item={item} size={22} className="overflow-hidden rounded-full" />
                    <span>{item.name}</span>
                  </div>
                );
              })}
            </div>
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
