import { pgTable, text, doublePrecision, timestamp, uuid } from "drizzle-orm/pg-core";

export const positions = pgTable("positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  symbol: text("symbol").notNull(),
  shares: doublePrecision("shares").notNull(),
  avgPrice: doublePrecision("avg_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const watchlist = pgTable("watchlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  symbol: text("symbol").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  userFullName: text("user_full_name"),
  userImageUrl: text("user_image_url"),
  symbol: text("symbol").notNull(),
  content: text("content").notNull(),
  sentiment: text("sentiment").$type<"BULLISH" | "BEARISH" | "NEUTRAL">().default("NEUTRAL").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
