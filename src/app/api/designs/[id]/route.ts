import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { designs } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "No database configured on this deployment." }, { status: 503 });
  }

  try {
    const db = getDb();
    const rows = await db.select().from(designs).where(eq(designs.id, id)).limit(1);
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Design not found." }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (err) {
    console.error("Failed to load design:", err);
    return NextResponse.json({ error: "Could not load the design." }, { status: 500 });
  }
}
