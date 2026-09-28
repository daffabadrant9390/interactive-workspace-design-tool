import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { CATALOG } from "@/lib/catalog";
import { fallbackAdvise } from "@/lib/advisor-fallback";

export const runtime = "nodejs";

const requestSchema = z.object({
  prompt: z.string().min(1).max(500),
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

  const { prompt } = parsed.data;
  const catalogList = CATALOG.map(
    (i) => `- ${i.id}: ${i.name} (${i.category}) — ${i.description}`,
  ).join("\n");

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      const { object } = await generateObject({
        model: google("gemini-2.5-flash-lite"),
        schema: suggestionSchema,
        prompt: `You are a workspace furniture advisor for a furniture rental company.
A customer describes how they work. Recommend 3-6 items from this EXACT catalog
(use the ids verbatim, never invent new ones). Include at most one desk and one chair.

Catalog:
${catalogList}

Customer: "${prompt}"`,
      });

      const validIds = new Set(CATALOG.map((i) => i.id));
      const suggestedItemIds = object.suggestedItemIds.filter((id) => validIds.has(id));

      return NextResponse.json({ message: object.message, suggestedItemIds, source: "ai" });
    } catch (err) {
      console.error("Advisor AI call failed, using fallback:", err);
      // fall through to the deterministic fallback below
    }
  }

  const fallback = fallbackAdvise(prompt);
  return NextResponse.json({ ...fallback, source: "fallback" });
}
