import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey().notNull(),
  projectId: text("project_id").notNull(),
  projectName: text("project_name").notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull().references(() => user.id, {
    onDelete: "cascade",
  }),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" })
    .notNull(),
});

export const deployment = pgTable("deployment", {
  id: text("id").primaryKey().notNull(),
  // url: text("url").notNull(),
  userId: text("user_id").notNull().references(() => user.id, {
    onDelete: "cascade",
  }),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull(),
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;
