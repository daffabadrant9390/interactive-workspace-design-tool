"use client";

import type { ReactNode } from "react";

/**
 * Mobile replacement for a permanent sidebar: slides up from the bottom,
 * capped at 80vh so the backdrop stays visible as a clear "tap to dismiss"
 * affordance. Used for both Catalog and Setup on narrow screens — see
 * WorkspaceApp.tsx, which renders the same panel components here that the
 * desktop layout renders as fixed-width <aside> columns.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Omit when the content already has its own visible header (e.g. SummaryPanel's
   *  "Your Setup" heading) — shows just the drag handle and close button instead
   *  of a redundant second title row. */
  title?: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative z-10 flex max-h-[80vh] w-full min-h-0 flex-col rounded-t-2xl border-t border-border bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-between border-b border-border px-4 py-3">
          <span className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-border" />
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="ml-auto rounded-full p-1 text-muted hover:bg-surface-2 hover:text-foreground"
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
