import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Lazily-created DB client. We don't throw at import time when DATABASE_URL
 * is missing, so the rest of the app (3D designer, pricing, AI advisor) still
 * works without a database configured — only save/share/request endpoints
 * need it.
 */
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add a free Neon Postgres connection string to .env.local (see README).",
    );
  }
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
