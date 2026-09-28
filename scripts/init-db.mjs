import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(url);

await sql`
  CREATE TABLE IF NOT EXISTS designs (
    id text PRIMARY KEY,
    name text NOT NULL DEFAULT 'Untitled workspace',
    floor_items jsonb NOT NULL,
    desk_items jsonb NOT NULL,
    duration text NOT NULL DEFAULT 'week',
    cycles integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
  );
`;

await sql`
  CREATE TABLE IF NOT EXISTS rental_requests (
    id text PRIMARY KEY,
    design_id text NOT NULL,
    contact_name text NOT NULL,
    contact_email text NOT NULL,
    note text,
    created_at timestamptz NOT NULL DEFAULT now()
  );
`;

const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name;
`;

console.log("Tables now in the database:", tables.map((t) => t.table_name));
