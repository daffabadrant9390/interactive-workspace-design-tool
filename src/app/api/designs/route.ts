import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb, isDbConfigured } from "@/lib/db";
import { designs } from "@/lib/db/schema";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().max(80).optional(),
  floorItems: z.array(z.record(z.string(), z.unknown())),
  deskItems: z.array(z.record(z.string(), z.unknown())),
  duration: z.enum(["week", "month"]),
  cycles: z.number().int().min(1).max(52),
});

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "No database configured on this deployment yet. See README for a free Neon setup." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid design payload." }, { status: 400 });
  }

  const id = nanoid(10);
  try {
    const db = getDb();
    await db.insert(designs).values({
      id,
      name: parsed.data.name ?? "Untitled workspace",
      floorItems: parsed.data.floorItems,
      deskItems: parsed.data.deskItems,
      duration: parsed.data.duration,
      cycles: parsed.data.cycles,
    });
    return NextResponse.json({ id });
  } catch (err) {
    console.error("Failed to save design:", err);
    return NextResponse.json({ error: "Could not save the design." }, { status: 500 });
  }
}
