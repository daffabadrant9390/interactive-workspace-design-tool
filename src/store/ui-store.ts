"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";
export type CurrencyCode = "USD" | "IDR";

interface UiState {
  theme: ThemeMode;
  currency: CurrencyCode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setCurrency: (currency: CurrencyCode) => void;
}

/**
 * Small, independent "how should the app look/behave for me" store — kept
 * separate from design-store (which is about the design itself) so resetting
 * or loading a shared design never touches these. Persisted to localStorage
 * so the choice survives a reload; the <html data-theme> attribute is also
 * synced here as a side effect so CSS (globals.css) just reads that attribute.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      currency: "USD",

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.dataset.theme = theme;
        }
      },
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        get().setTheme(next);
      },
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: "ciptaforge-ui-prefs",
      // We apply the theme to <html> ourselves (via the inline bootstrap
      // script in layout.tsx and setTheme above), so skip zustand's own
      // auto-rehydrate-on-mount flash and do it explicitly once on the client.
      skipHydration: true,
    },
  ),
);
