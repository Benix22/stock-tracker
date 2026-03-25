import { pgTable, text, doublePrecision, timestamp, uuid } from "drizzle-orm/pg-core";

export const positions = pgTable("positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  symbol: text("symbol").notNull(),
  shares: doublePrecision("shares").notNull(),
  avgPrice: doublePrecision("avg_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
