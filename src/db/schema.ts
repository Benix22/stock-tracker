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

// ─── LEAGUE TABLES ─────────────────────────────────────────────────────────

export const leagues = pgTable("leagues", {
  id: uuid("id").primaryKey().defaultRandom(),
  month: text("month").notNull(), // e.g. "04"
  year: text("year").notNull(), // e.g. "2026"
  status: text("status").$type<"ACTIVE" | "COMPLETED">().default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leagueParticipants = pgTable("league_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  leagueId: uuid("league_id").references(() => leagues.id).notNull(),
  userId: text("user_id").notNull(),
  userFullName: text("user_full_name"),
  userImageUrl: text("user_image_url"),
  cashBalance: doublePrecision("cash_balance").default(100000).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const leaguePositions = pgTable("league_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  participantId: uuid("participant_id").references(() => leagueParticipants.id, { onDelete: 'cascade' }).notNull(),
  symbol: text("symbol").notNull(),
  shares: doublePrecision("shares").notNull(),
  avgPrice: doublePrecision("avg_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
