import { describe, expect, it } from "vitest";
import { detectCurrencyHint, formatCurrency, USD_TO_IDR_RATE } from "./currency";

describe("formatCurrency", () => {
  it("formats USD the same way formatUsd always did", () => {
    expect(formatCurrency(1500, "USD")).toBe("$15.00");
    expect(formatCurrency(0, "USD")).toBe("$0.00");
    expect(formatCurrency(999, "USD")).toBe("$9.99");
  });

  it("converts to IDR using the fixed demo rate, rounded to whole rupiah", () => {
    // 1500 cents = $15.00 -> 15 * 15800 = 237000
    const expected = (237_000).toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    });
    expect(formatCurrency(1500, "IDR")).toBe(expected);
  });

  it("never shows IDR fractional subunits (no sen in practice)", () => {
    const formatted = formatCurrency(999, "IDR");
    expect(formatted).not.toContain(",");
  });

  it("scales linearly with the exchange rate constant", () => {
    const oneDollarIdr = Math.round(1 * USD_TO_IDR_RATE);
    expect(formatCurrency(100, "IDR")).toBe(
      oneDollarIdr.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }),
    );
  });
});

describe("detectCurrencyHint", () => {
  it("detects IDR from 'rupiah'", () => {
    expect(detectCurrencyHint("pay around 500000 rupiah per week")).toBe("IDR");
  });

  it("detects IDR from 'rp' or 'Rp.'", () => {
    expect(detectCurrencyHint("budget is Rp 500000")).toBe("IDR");
    expect(detectCurrencyHint("budget is Rp. 500000")).toBe("IDR");
  });

  it("detects IDR from 'idr'", () => {
    expect(detectCurrencyHint("budget 500000 IDR")).toBe("IDR");
  });

  it("detects USD from 'usd' or 'dollars' or 'bucks'", () => {
    expect(detectCurrencyHint("only 50 USD per week")).toBe("USD");
    expect(detectCurrencyHint("about 50 dollars a week")).toBe("USD");
    expect(detectCurrencyHint("just 50 bucks")).toBe("USD");
  });

  it("detects USD from a dollar sign followed by a number", () => {
    expect(detectCurrencyHint("I only want to pay around $50 per week")).toBe("USD");
  });

  it("returns null when neither currency is mentioned", () => {
    expect(detectCurrencyHint("I trade stocks and need 2 screens")).toBeNull();
  });

  it("returns null when both currencies are mentioned (ambiguous)", () => {
    expect(detectCurrencyHint("is 50 usd the same as 500000 rupiah?")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(detectCurrencyHint("RUPIAH only please")).toBe("IDR");
    expect(detectCurrencyHint("DOLLARS only please")).toBe("USD");
  });
});
