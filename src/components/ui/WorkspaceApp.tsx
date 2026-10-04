"use client";

import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { CatalogPanel } from "./CatalogPanel";
import { SummaryPanel } from "./SummaryPanel";
import { Toolbar } from "./Toolbar";
import { AdvisorModal } from "./AdvisorModal";
import { PreferencesToggle } from "./PreferencesToggle";
import { BottomSheet } from "./BottomSheet";
import { Scene } from "@/components/scene/Scene";
import { useIsDesktop } from "@/lib/use-is-desktop";
import { useDesignStore } from "@/store/design-store";
import { useUiStore } from "@/store/ui-store";
import { computePriceBreakdown } from "@/lib/pricing";
import { formatCurrency } from "@/lib/currency";

export function WorkspaceApp({ banner }: { banner?: ReactNode }) {
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const isDesktop = useIsDesktop();

  // Only needed for the mobile "Setup" tab's running total — the desktop
  // SummaryPanel computes this itself since it's always on screen there.
  const floorItems = useDesignStore((s) => s.floorItems);
  const deskItems = useDesignStore((s) => s.deskItems);
  const duration = useDesignStore((s) => s.duration);
  const cycles = useDesignStore((s) => s.cycles);
  const currency = useUiStore((s) => s.currency);
  const grandTotalCents = computePriceBreakdown(floorItems, deskItems, duration, cycles).grandTotalCents;
  const dragModeActive = useDesignStore((s) => s.dragModeActive);
  const toggleDragMode = useDesignStore((s) => s.toggleDragMode);

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">
            Design Your Workspace <span className="text-muted">· CiptaForge</span>
          </h1>
          <p className="hidden text-xs text-muted sm:block">
            Preview an item on the left, then place it in the room. Hover a placed item for move / rotate / remove.
          </p>
        </div>
        <PreferencesToggle />
      </header>

      {banner}
      <Toolbar onOpenAdvisor={() => setAdvisorOpen(true)} />

      <div className="relative flex min-h-0 flex-1">
        {isDesktop && (
          <aside className="w-80 min-h-0 border-r border-border bg-background">
            <CatalogPanel />
          </aside>
        )}

        <main className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <Scene />
          </div>
        </main>

        {isDesktop && (
          <aside className="w-96 min-h-0 border-l border-border bg-background">
            <SummaryPanel />
          </aside>
        )}

        {/* Mobile-only: lets the room be panned into view on a small screen
            without fat-fingering a placement/selection while dragging. Sits
            above the bottom tab bar so it's always reachable, including
            while drag mode is itself active and everything else is
            disabled. */}
        {!isDesktop && (
          <button
            onClick={toggleDragMode}
            title={dragModeActive ? "Exit drag mode" : "Drag mode — pan the room"}
            aria-pressed={dragModeActive}
            className={clsx(
              "absolute bottom-3 left-3 z-20 flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-colors",
              dragModeActive
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-surface text-foreground hover:bg-surface-2",
            )}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="5 9 2 12 5 15" />
              <polyline points="9 5 12 2 15 5" />
              <polyline points="15 19 12 22 9 19" />
              <polyline points="19 9 22 12 19 15" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="12" y1="2" x2="12" y2="22" />
            </svg>
          </button>
        )}
      </div>

      {/* Mobile-only bottom tab bar, replacing the two permanent sidebars. */}
      {!isDesktop && (
        <div className="flex items-center gap-2 border-t border-border bg-surface px-3 py-2.5">
          <button
            onClick={() => setCatalogOpen(true)}
            disabled={dragModeActive}
            className="flex-1 rounded-full border border-border bg-surface-2 py-2.5 text-sm font-semibold hover:bg-border disabled:cursor-not-allowed disabled:opacity-40"
          >
            🛋️ Catalog
          </button>
          <button
            onClick={() => setSummaryOpen(true)}
            className="flex-1 rounded-full bg-accent py-2.5 text-sm font-semibold text-accent-foreground"
          >
            🧾 Setup · {formatCurrency(grandTotalCents, currency)}
          </button>
        </div>
      )}

      {!isDesktop && (
        <>
          <BottomSheet open={catalogOpen} onClose={() => setCatalogOpen(false)} title="Catalog">
            <CatalogPanel />
          </BottomSheet>
          <BottomSheet open={summaryOpen} onClose={() => setSummaryOpen(false)}>
            <SummaryPanel />
          </BottomSheet>
        </>
      )}

      {advisorOpen && <AdvisorModal onClose={() => setAdvisorOpen(false)} />}
    </div>
  );
}
