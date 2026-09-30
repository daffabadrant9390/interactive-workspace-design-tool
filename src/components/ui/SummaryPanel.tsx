"use client";

import { useMemo, useState } from "react";
import { useDesignStore } from "@/store/design-store";
import { computePriceBreakdown, formatUsd } from "@/lib/pricing";

export function SummaryPanel() {
  const floorItems = useDesignStore((s) => s.floorItems);
  const deskItems = useDesignStore((s) => s.deskItems);
  const duration = useDesignStore((s) => s.duration);
  const cycles = useDesignStore((s) => s.cycles);
  const removeFloorItem = useDesignStore((s) => s.removeFloorItem);
  const removeDeskItem = useDesignStore((s) => s.removeDeskItem);

  const breakdown = useMemo(
    () => computePriceBreakdown(floorItems, deskItems, duration, cycles),
    [floorItems, deskItems, duration, cycles],
  );

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [designId, setDesignId] = useState<string | null>(null);

  const [requestOpen, setRequestOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [note, setNote] = useState("");
  const [requestState, setRequestState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const isEmpty = floorItems.length === 0 && deskItems.length === 0;

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floorItems, deskItems, duration, cycles }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save this design.");
      }
      const data = await res.json();
      setDesignId(data.id);
      setShareUrl(`${window.location.origin}/d/${data.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendRequest() {
    if (!designId) return;
    setRequestState("sending");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId, contactName, contactEmail, note }),
      });
      if (!res.ok) throw new Error();
      setRequestState("sent");
    } catch {
      setRequestState("error");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Your Setup</h2>
        {breakdown.appliedBundle && (
          <p className="mt-1 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs text-accent">
            🎉 Qualifies for <strong>{breakdown.appliedBundle.name}</strong> —{" "}
            {breakdown.appliedBundle.discountPct}% off
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {isEmpty && (
          <p className="text-sm text-muted">
            Nothing here yet — place a desk and chair on the left to get started, or try a quick-start above the room.
          </p>
        )}
        <ul className="space-y-2">
          {breakdown.lines.map((line) => (
            <li
              key={line.instanceId}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="truncate pr-2">{line.name}</span>
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap font-medium text-accent">
                  {formatUsd(line.discountedWeeklyCents)}/wk
                </span>
                <button
                  onClick={() =>
                    floorItems.some((f) => f.instanceId === line.instanceId)
                      ? removeFloorItem(line.instanceId)
                      : removeDeskItem(line.instanceId)
                  }
                  className="text-muted hover:text-invalid"
                  aria-label={`Remove ${line.name}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 border-t border-border px-4 py-3">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Weekly subtotal</span>
          <span>{formatUsd(breakdown.weeklySubtotalCents)}</span>
        </div>
        <div className="flex items-center justify-between text-base font-semibold">
          <span>Total ({breakdown.totalWeeks} weeks)</span>
          <span>{formatUsd(breakdown.grandTotalCents)}</span>
        </div>

        <button
          onClick={handleSave}
          disabled={isEmpty || saving}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save & Get Shareable Link"}
        </button>
        {saveError && <p className="text-xs text-invalid">{saveError}</p>}

        {shareUrl && (
          <div className="space-y-2 rounded-lg border border-border bg-surface p-2.5 text-xs">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 truncate rounded-md bg-surface-2 px-2 py-1"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="rounded-md bg-surface-2 px-2 py-1 font-medium hover:bg-border"
              >
                Copy
              </button>
            </div>

            {!requestOpen ? (
              <button
                onClick={() => setRequestOpen(true)}
                className="w-full rounded-md border border-accent/40 py-1.5 font-semibold text-accent hover:bg-accent/10"
              >
                Request This Setup →
              </button>
            ) : requestState === "sent" ? (
              <p className="text-center text-accent">Thanks — we&apos;ll follow up shortly!</p>
            ) : (
              <div className="space-y-1.5">
                <input
                  placeholder="Your name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-md bg-surface-2 px-2 py-1.5"
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-md bg-surface-2 px-2 py-1.5"
                />
                <textarea
                  placeholder="Delivery notes (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full rounded-md bg-surface-2 px-2 py-1.5"
                />
                <button
                  onClick={handleSendRequest}
                  disabled={!contactName || !contactEmail || requestState === "sending"}
                  className="w-full rounded-md bg-accent py-1.5 font-semibold text-accent-foreground disabled:opacity-40"
                >
                  {requestState === "sending" ? "Sending…" : "Send Request"}
                </button>
                {requestState === "error" && (
                  <p className="text-invalid">Couldn&apos;t send that — try again.</p>
                )}
              </div>
            )}
          </div>
        )}
        <p className="text-[10px] leading-snug text-muted">
          Prices are illustrative placeholders for this demo, not live CiptaForge pricing.
        </p>
      </div>
    </div>
  );
}
