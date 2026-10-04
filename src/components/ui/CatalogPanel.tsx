"use client";

import { useState } from "react";
import clsx from "clsx";
import { CATALOG } from "@/lib/catalog";
import { formatCurrency } from "@/lib/currency";
import { useDesignStore } from "@/store/design-store";
import { useUiStore } from "@/store/ui-store";
import { ItemThumbnail } from "./ItemThumbnail";
import { ItemPreviewModal } from "./ItemPreviewModal";
import type { CatalogItem, ItemCategory } from "@/lib/types";

interface TabDef {
  id: string;
  label: string;
  categories: ItemCategory[];
}

const TABS: TabDef[] = [
  { id: "desks", label: "Desks", categories: ["desk"] },
  { id: "chairs", label: "Chairs", categories: ["chair"] },
  { id: "monitors", label: "Monitors", categories: ["monitor"] },
  { id: "accessories", label: "Accessories", categories: ["accessory"] },
  { id: "break", label: "Break Corner", categories: ["break", "plant", "storage"] },
];

export function CatalogPanel() {
  const [tab, setTab] = useState(TABS[0].id);
  const [previewItem, setPreviewItem] = useState<CatalogItem | null>(null);
  const pending = useDesignStore((s) => s.pending);
  const clearPending = useDesignStore((s) => s.clearPending);
  const selectedDeskInstanceId = useDesignStore((s) => s.selectedDeskInstanceId);
  const dragModeActive = useDesignStore((s) => s.dragModeActive);
  const currency = useUiStore((s) => s.currency);

  const activeTab = TABS.find((t) => t.id === tab)!;
  const items = CATALOG.filter((i) => activeTab.categories.includes(i.category));
  const isDeskSlotTab = activeTab.categories.every((c) => c === "monitor" || c === "accessory");

  return (
    <div
      className={clsx(
        "flex h-full flex-col transition-opacity",
        dragModeActive && "pointer-events-none opacity-40",
      )}
    >
      <div className="flex gap-1 overflow-x-auto border-b border-border px-3 pt-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              "whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-surface-2 text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isDeskSlotTab && (
        <div
          className={clsx(
            "mx-3 mt-3 rounded-lg border px-3 py-2 text-xs",
            selectedDeskInstanceId
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-border bg-surface text-muted",
          )}
        >
          {selectedDeskInstanceId
            ? "Adding to the selected desk."
            : "Click a desk in the room first to add these."}
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {items.map((item) => {
          const isPendingThis = pending?.kind === "floor" && pending.catalogId === item.id;
          return (
            <div
              key={item.id}
              className={clsx(
                "flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
                isPendingThis ? "border-accent bg-accent/10" : "border-border bg-surface",
              )}
            >
              <ItemThumbnail
                item={item}
                size={44}
                className="shrink-0 overflow-hidden rounded-lg bg-surface-2"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="truncate text-xs text-muted">{item.description}</p>
                <p className="mt-0.5 text-xs font-semibold text-accent">
                  {formatCurrency(item.weeklyPriceUsdCents, currency)}
                  <span className="text-muted">/week</span>
                </p>
              </div>

              {item.placement === "floor" ? (
                <button
                  onClick={() => (isPendingThis ? clearPending() : setPreviewItem(item))}
                  className={clsx(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    isPendingThis
                      ? "bg-accent text-accent-foreground"
                      : "bg-surface-2 text-foreground hover:bg-border",
                  )}
                >
                  {isPendingThis ? "Placing…" : "Preview"}
                </button>
              ) : (
                <button
                  onClick={() => setPreviewItem(item)}
                  className="shrink-0 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-border"
                >
                  Preview
                </button>
              )}
            </div>
          );
        })}
      </div>

      {previewItem && (
        <ItemPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}
    </div>
  );
}
