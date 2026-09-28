import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js conventionally uses .env.local for local secrets; drizzle-kit runs
// outside Next's env loader, so load it explicitly here.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
