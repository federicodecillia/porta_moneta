import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const members = pgTable("members", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
