import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { designs, rentalRequests } from "@/lib/db/schema";
import { computePriceBreakdown, type DurationOption } from "@/lib/pricing";
import { isEmailConfigured } from "@/lib/email/resend-client";
import { sendRequestConfirmationEmail } from "@/lib/email/send-request-confirmation";
import type { PlacedDeskItem, PlacedFloorItem } from "@/lib/types";

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

  const requestId = nanoid(10);

  try {
    const db = getDb();
    await db.insert(rentalRequests).values({
      id: requestId,
      designId: parsed.data.designId,
      contactName: parsed.data.contactName,
      contactEmail: parsed.data.contactEmail,
      note: parsed.data.note,
    });
  } catch (err) {
    console.error("Failed to save rental request:", err);
    return NextResponse.json({ error: "Could not send the request." }, { status: 500 });
  }

  // The lead is saved at this point regardless of what happens below, so an
  // email failure never turns into a 500 for something the customer already
  // successfully submitted. We just report back whether it went out.
  let emailSent = false;
  if (isEmailConfigured()) {
    try {
      const db = getDb();
      const rows = await db.select().from(designs).where(eq(designs.id, parsed.data.designId)).limit(1);
      const design = rows[0];
      if (design) {
        const breakdown = computePriceBreakdown(
          design.floorItems as PlacedFloorItem[],
          design.deskItems as PlacedDeskItem[],
          design.duration as DurationOption,
          design.cycles,
        );
        const shareUrl = `${new URL(request.url).origin}/d/${parsed.data.designId}`;
        await sendRequestConfirmationEmail({
          requestId,
          createdAt: new Date(),
          contactName: parsed.data.contactName,
          contactEmail: parsed.data.contactEmail,
          note: parsed.data.note,
          shareUrl,
          duration: design.duration as DurationOption,
          cycles: design.cycles,
          breakdown,
        });
        emailSent = true;
      } else {
        console.error(`Could not send confirmation email: design ${parsed.data.designId} not found.`);
      }
    } catch (err) {
      console.error("Failed to send confirmation email:", err);
    }
  }

  return NextResponse.json({ ok: true, emailSent });
}
