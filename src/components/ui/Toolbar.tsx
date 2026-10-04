"use client";

import { useEffect } from "react";
import clsx from "clsx";
import { useDesignStore } from "@/store/design-store";
import { PERSONAS } from "@/lib/personas";

export function Toolbar({ onOpenAdvisor }: { onOpenAdvisor: () => void }) {
  const duration = useDesignStore((s) => s.duration);
  const setDuration = useDesignStore((s) => s.setDuration);
  const cycles = useDesignStore((s) => s.cycles);
  const setCycles = useDesignStore((s) => s.setCycles);
  const undo = useDesignStore((s) => s.undo);
  const redo = useDesignStore((s) => s.redo);
  const reset = useDesignStore((s) => s.reset);
  const history = useDesignStore((s) => s.history);
  const future = useDesignStore((s) => s.future);
  const applyPersona = useDesignStore((s) => s.applyPersona);
  const lastError = useDesignStore((s) => s.lastError);
  const setPending = useDesignStore((s) => s.setPending);
  const dragModeActive = useDesignStore((s) => s.dragModeActive);

  useEffect(() => {
    if (!lastError) return;
    const t = setTimeout(() => useDesignStore.setState({ lastError: null }), 3200);
    return () => clearTimeout(t);
  }, [lastError]);

  return (
    <div
      className={clsx(
        "flex items-center gap-2 overflow-x-auto border-b border-border bg-surface px-4 py-3 transition-opacity lg:flex-wrap lg:overflow-visible",
        dragModeActive && "pointer-events-none opacity-40",
      )}
    >
      <button
        onClick={onOpenAdvisor}
        className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-90"
      >
        ✨ Ask AI
      </button>

      <div className="mx-1 h-6 w-px shrink-0 bg-border" />

      <div className="flex shrink-0 items-center gap-1.5">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPersona(p)}
            className="shrink-0 whitespace-nowrap rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:bg-border"
            title={`Quick-start: ${p.label}`}
          >
            <span className="mr-1">{p.emoji}</span>
            {p.label}
          </button>
        ))}
      </div>

      <div className="mx-2 h-6 w-px shrink-0 bg-border" />

      <div className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-border bg-surface-2 p-1 text-xs">
        <button
          onClick={() => setDuration("week")}
          className={clsx("rounded-full px-2.5 py-1 font-medium", duration === "week" && "bg-accent text-accent-foreground")}
        >
          Weekly
        </button>
        <button
          onClick={() => setDuration("month")}
          className={clsx("rounded-full px-2.5 py-1 font-medium", duration === "month" && "bg-accent text-accent-foreground")}
        >
          Monthly (save 30%)
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-muted">
        <span>for</span>
        <input
          type="number"
          min={1}
          max={26}
          value={cycles}
          onChange={(e) => setCycles(Number(e.target.value) || 1)}
          className="w-12 rounded-md border border-border bg-surface px-1.5 py-1 text-center text-foreground"
        />
        <span>{duration === "week" ? "week(s)" : "month(s)"}</span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {lastError && (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-invalid/15 px-3 py-1.5 text-xs font-medium text-invalid">
            {lastError}
          </span>
        )}
        <button
          onClick={() => setPending(null)}
          className="shrink-0 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-2"
        >
          Cancel placing
        </button>
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="shrink-0 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          className="shrink-0 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Redo
        </button>
        <button
          onClick={reset}
          className="shrink-0 whitespace-nowrap rounded-full border border-invalid/40 px-3 py-1.5 text-xs font-medium text-invalid hover:bg-invalid/10"
        >
          Clear room
        </button>
      </div>
    </div>
  );
}
