"use client";

import { useState } from "react";
import clsx from "clsx";
import { COLOR_PALETTE, CM_PER_TILE } from "@/lib/catalog";
import { formatCurrency } from "@/lib/currency";
import { useDesignStore } from "@/store/design-store";
import { useUiStore } from "@/store/ui-store";
import { ItemThumbnail } from "./ItemThumbnail";
import type { CatalogItem } from "@/lib/types";

/** A handful of curated swatches plus the item's own original color, deduped. */
function paletteFor(item: CatalogItem): string[] {
  return Array.from(new Set([item.color, ...COLOR_PALETTE]));
}

export function ItemPreviewModal({
  item,
  onClose,
}: {
  item: CatalogItem;
  onClose: () => void;
}) {
  const [color, setColor] = useState(item.color);
  const setPending = useDesignStore((s) => s.setPending);
  const addDeskSlotItem = useDesignStore((s) => s.addDeskSlotItem);
  const selectedDeskInstanceId = useDesignStore((s) => s.selectedDeskInstanceId);
  const currency = useUiStore((s) => s.currency);

  const isFloor = item.placement === "floor";
  const palette = paletteFor(item);

  function handleConfirm() {
    if (isFloor) {
      setPending({ kind: "floor", catalogId: item.id, color });
    } else {
      addDeskSlotItem(item.id, color);
    }
    onClose();
  }

  const canConfirm = isFloor || Boolean(selectedDeskInstanceId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">{item.name}</h2>
            <p className="text-xs text-muted">{item.description}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-muted hover:bg-surface-2 hover:text-foreground"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center rounded-xl bg-surface-2">
          <ItemThumbnail key={color} item={item} color={color} size={180} />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted">Price</dt>
          <dd className="text-right font-semibold text-accent">
            {formatCurrency(item.weeklyPriceUsdCents, currency)}/week
          </dd>

          <dt className="text-muted">Size</dt>
          <dd className="text-right font-medium">
            {item.footprint
              ? `${item.footprint.w}×${item.footprint.d} tile${item.footprint.w * item.footprint.d > 1 ? "s" : ""} (~${item.footprint.w * CM_PER_TILE}×${item.footprint.d * CM_PER_TILE}cm)`
              : item.monitor
                ? `${item.monitor.sizeInches}" ${item.monitor.curved ? "curved " : ""}monitor`
                : "Sits on a desk"}
          </dd>

          {item.monitor && (
            <>
              <dt className="text-muted">Needs desk</dt>
              <dd className="text-right font-medium">≥{item.monitor.minDeskWidthCm}cm wide</dd>
            </>
          )}
        </dl>

        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium text-muted">Color</p>
          <div className="flex flex-wrap gap-2">
            {palette.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                title={c}
                className={clsx(
                  "h-7 w-7 rounded-full border-2 transition-transform",
                  color === c ? "scale-110 border-accent" : "border-border hover:scale-105",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {!isFloor && !selectedDeskInstanceId && (
          <p className="mt-3 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
            Select a desk in the room first, then come back to add this.
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isFloor ? "Place in Room" : "Add to Desk"}
          </button>
        </div>
      </div>
    </div>
  );
}
