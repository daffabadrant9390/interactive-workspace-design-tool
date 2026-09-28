import { pgTable, text, jsonb, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * A saved workspace design — created every time someone clicks
 * "Save & Get Link" or "Request This Setup". Lets the app produce a real,
 * shareable /d/[id] URL instead of only working in-memory.
 */
export const designs = pgTable("designs", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default("Untitled workspace"),
  floorItems: jsonb("floor_items").notNull(),
  deskItems: jsonb("desk_items").notNull(),
  duration: text("duration").notNull().default("week"),
  cycles: integer("cycles").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A "Request This Setup" submission tied to a saved design — the closest
 * thing to a real conversion event in this MVP (there's no payment flow).
 */
export const rentalRequests = pgTable("rental_requests", {
  id: text("id").primaryKey(),
  designId: text("design_id").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
