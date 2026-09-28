import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb, isDbConfigured } from "@/lib/db";
import { rentalRequests } from "@/lib/db/schema";

export const runtime = "nodejs";

const bodySchema = z.object({
  designId: z.string().min(1),
  contactName: z.string().min(1).max(120),
  contactEmail: z.string().email(),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "No database configured on this deployment." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  try {
    const db = getDb();
    await db.insert(rentalRequests).values({
      id: nanoid(10),
      designId: parsed.data.designId,
      contactName: parsed.data.contactName,
      contactEmail: parsed.data.contactEmail,
      note: parsed.data.note,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to save rental request:", err);
    return NextResponse.json({ error: "Could not send the request." }, { status: 500 });
  }
}
