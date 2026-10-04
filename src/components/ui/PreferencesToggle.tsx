"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useUiStore } from "@/store/ui-store";

/**
 * Theme + currency switches, grouped together in the header since both are
 * "how I want to view this" preferences rather than design state. Rendering
 * is deferred until the persisted store has rehydrated on the client (see
 * useEffect below) so we never show a button that doesn't match the theme
 * the bootstrap script in layout.tsx already applied to <html>.
 */
export function PreferencesToggle() {
  const [hydrated, setHydrated] = useState(false);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const currency = useUiStore((s) => s.currency);
  const setCurrency = useUiStore((s) => s.setCurrency);

  useEffect(() => {
    useUiStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  if (!hydrated) {
    // Reserve the same footprint so the header doesn't jump once hydrated.
    return <div className="h-8 w-[142px]" aria-hidden />;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-border bg-surface-2 p-1 text-xs">
        <button
          onClick={() => setCurrency("USD")}
          className={clsx(
            "rounded-full px-2.5 py-1 font-medium",
            currency === "USD" && "bg-accent text-accent-foreground",
          )}
        >
          USD
        </button>
        <button
          onClick={() => setCurrency("IDR")}
          className={clsx(
            "rounded-full px-2.5 py-1 font-medium",
            currency === "IDR" && "bg-accent text-accent-foreground",
          )}
        >
          IDR
        </button>
      </div>

      <button
        onClick={toggleTheme}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-2 text-sm hover:bg-border"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </div>
  );
}
