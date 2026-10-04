import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { CATALOG } from "@/lib/catalog";
import { fallbackAdvise } from "@/lib/advisor-fallback";
import { applyBudgetConstraint } from "@/lib/advisor-budget";

export const runtime = "nodejs";

const requestSchema = z.object({
  prompt: z.string().min(1).max(500),
  // Always USD, converted client-side if the visitor is viewing in IDR — see
  // AdvisorModal.tsx. Capped well above anything realistic for this catalog.
  weeklyBudgetUsd: z.number().positive().max(100_000).optional(),
});

const suggestionSchema = z.object({
  message: z.string().describe("One short, friendly sentence explaining the recommendation."),
  suggestedItemIds: z
    .array(z.string())
    .describe("Catalog item IDs to suggest, most important first."),
});

// A crude per-process rate limiter. This is a portfolio MVP, not a production
// service — this just stops one visitor from burning the whole free Gemini
// quota by hammering the endpoint.
const requestLog = new Map<string, number[]>();
const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return timestamps.length > RATE_LIMIT;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { message: "Too many requests — try again in a minute.", suggestedItemIds: [] },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { prompt, weeklyBudgetUsd } = parsed.data;
  const budgetWeeklyCents = weeklyBudgetUsd !== undefined ? Math.round(weeklyBudgetUsd * 100) : undefined;
  const catalogList = CATALOG.map(
    (i) => `- ${i.id}: ${i.name} (${i.category}) — ${i.description} — $${(i.weeklyPriceUsdCents / 100).toFixed(2)}/wk`,
  ).join("\n");

  const budgetInstruction = budgetWeeklyCents
    ? `\nThe customer's weekly budget is $${(budgetWeeklyCents / 100).toFixed(2)}. If they describe more than one
person (e.g. a team or multiple members), suggest enough desks/chairs/monitors for the group — you can repeat an
id for more than one unit of it. Prefer a combined weekly price at or under the budget; if everything they'd need
doesn't fit, keep only the most essential items and drop the rest, in priority order.`
    : "";

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      const { object } = await generateObject({
        model: google("gemini-2.5-flash-lite"),
        schema: suggestionSchema,
        prompt: `You are a workspace furniture advisor for a furniture rental company.
A customer describes how they work. Recommend 3-6 items from this EXACT catalog
(use the ids verbatim, never invent new ones; repeat an id if more than one unit is needed).
Order suggestedItemIds with the most important item first — a trim pass downstream may drop
items off the end of your list if they go over budget, so put anything essential early.

Catalog:
${catalogList}

Customer: "${prompt}"${budgetInstruction}`,
      });

      const validIds = new Set(CATALOG.map((i) => i.id));
      const aiSuggestedIds = object.suggestedItemIds.filter((id) => validIds.has(id));
      const { itemIds, estimatedWeeklyCents, trimmed } = applyBudgetConstraint(aiSuggestedIds, budgetWeeklyCents);

      return NextResponse.json({
        message: object.message,
        suggestedItemIds: itemIds,
        estimatedWeeklyCents,
        budgetWeeklyCents: budgetWeeklyCents ?? null,
        trimmedForBudget: trimmed,
        source: "ai",
      });
    } catch (err) {
      console.error("Advisor AI call failed, using fallback:", err);
      // fall through to the deterministic fallback below
    }
  }

  const fallback = fallbackAdvise(prompt);
  const { itemIds, estimatedWeeklyCents, trimmed } = applyBudgetConstraint(
    fallback.suggestedItemIds,
    budgetWeeklyCents,
  );

  return NextResponse.json({
    message: fallback.message,
    suggestedItemIds: itemIds,
    estimatedWeeklyCents,
    budgetWeeklyCents: budgetWeeklyCents ?? null,
    trimmedForBudget: trimmed,
    source: "fallback",
  });
}
