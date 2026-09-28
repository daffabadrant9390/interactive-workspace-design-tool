import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { designs } from "@/lib/db/schema";
import { SharedDesignClient } from "./SharedDesignClient";

export const runtime = "nodejs";

export default async function SharedDesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isDbConfigured()) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6 text-center text-foreground">
        <div>
          <h1 className="text-lg font-semibold">No database configured</h1>
          <p className="mt-2 max-w-sm text-sm text-muted">
            This deployment doesn&apos;t have a DATABASE_URL set, so saved designs can&apos;t be loaded.
            See the README for a two-minute free Neon setup.
          </p>
        </div>
      </div>
    );
  }

  const db = getDb();
  const rows = await db.select().from(designs).where(eq(designs.id, id)).limit(1);
  const row = rows[0];
  if (!row) notFound();

  return <SharedDesignClient design={row} />;
}
