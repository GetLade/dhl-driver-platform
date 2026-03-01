import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Table to store n8n webhook data updates
 * This allows the frontend to query the latest data received from n8n workflows
 */
export const n8nWebhookData = mysqlTable("n8n_webhook_data", {
  id: int("id").autoincrement().primaryKey(),
  /** Type of data: flight, odin, or gtliste */
  dataType: varchar("dataType", { length: 32 }).notNull(),
  /** The actual data payload from n8n (stored as JSON string) */
  payload: text("payload").notNull(),
  /** Timestamp when the webhook was received */
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  /** Timestamp when the data was last updated */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type N8nWebhookData = typeof n8nWebhookData.$inferSelect;
export type InsertN8nWebhookData = typeof n8nWebhookData.$inferInsert;
