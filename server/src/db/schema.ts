import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey().notNull(), // f.eks. 'local-123' eller 'github-456'
  username: text("username").notNull().unique(),
  projectId: text("project_id").notNull(),
  projectName: text("project_name").notNull(),
  elo: integer("elo").notNull().default(1000),
});

export const userAuth = pgTable("user_auth", {
  userId: text("user_id").primaryKey().references(() => user.id).notNull(),
  passwordHash: text("password_hash").notNull(),
});
export const userOAuth = pgTable("user_oauth", {
  userId: text("user_id").primaryKey().references(() => user.id).notNull(),
  provider: text("provider").notNull(), // f.eks. 'github'
  providerUserId: text("provider_user_id").notNull(), // f.eks. GitHub-ID
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
  userId: text("user_id").notNull().references(() => user.id, {
    onDelete: "cascade",
  }),
  code: text("code").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull(),
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;
