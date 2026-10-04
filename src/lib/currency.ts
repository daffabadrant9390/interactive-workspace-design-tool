import type { CurrencyCode } from "@/store/ui-store";

/**
 * Fixed, illustrative USD → IDR rate (this app's prices are demo placeholders
 * already, not live pricing — see the footer note in SummaryPanel). A real
 * deployment would pull this from a live FX source instead of a constant.
 */
export const USD_TO_IDR_RATE = 15_800;

/**
 * All prices in the catalog/pricing layer are stored as USD cents (see
 * CatalogItem.weeklyPriceUsdCents). This converts and formats them for
 * display in whichever currency the user has picked, without changing how
 * anything is stored or computed upstream — IDR is a view-layer concern.
 */
export function formatCurrency(usdCents: number, currency: CurrencyCode): string {
  const usdAmount = usdCents / 100;

  if (currency === "IDR") {
    const idrAmount = Math.round(usdAmount * USD_TO_IDR_RATE);
    return idrAmount.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    });
  }

  return usdAmount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const IDR_HINT = /\b(rp\.?|rupiah|idr)\b/i;
const USD_HINT = /\b(usd|dollars?|bucks)\b|\$\s?\d/i;

/**
 * Looks for an explicit currency mention in free text (e.g. the advisor
 * prompt) so a typed budget number can be interpreted correctly even when it
 * disagrees with the app's current currency toggle — "pay around 500000
 * rupiah" should mean IDR regardless of what the header switch is set to.
 * Returns null when the text mentions neither (or, deliberately, both —
 * ambiguous input falls back to whatever the caller already assumes, e.g.
 * the currency toggle, rather than guessing).
 */
export function detectCurrencyHint(text: string): CurrencyCode | null {
  const hasIdr = IDR_HINT.test(text);
  const hasUsd = USD_HINT.test(text);
  if (hasIdr && !hasUsd) return "IDR";
  if (hasUsd && !hasIdr) return "USD";
  return null;
}
