"use server"

import { db } from "@/db";
import { watchlist } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getWatchlist() {
  const { userId } = await auth();
  const cleanId = userId?.trim();
  
  if (!cleanId) return [];
  
  const results = await db.query.watchlist.findMany({
    where: eq(watchlist.userId, cleanId),
    orderBy: (watchlist, { desc }) => [desc(watchlist.createdAt)]
  });
  
  return results.map(r => r.symbol);
}

export async function addToWatchlistAction(symbol: string) {
  const { userId } = await auth();
  const cleanId = userId?.trim();

  if (!cleanId) throw new Error("Unauthorized");

  const upper = symbol.toUpperCase();

  const existing = await db.query.watchlist.findFirst({
    where: and(eq(watchlist.userId, cleanId), eq(watchlist.symbol, upper))
  });

  if (!existing) {
    await db.insert(watchlist).values({
      userId: cleanId,
      symbol: upper,
    });
    revalidatePath("/");
  }
}

export async function removeFromWatchlistAction(symbol: string) {
  const { userId } = await auth();
  const cleanId = userId?.trim();
  
  if (!cleanId) throw new Error("Unauthorized");

  const upper = symbol.toUpperCase();

  await db.delete(watchlist)
    .where(and(eq(watchlist.userId, cleanId), eq(watchlist.symbol, upper)));
    
  revalidatePath("/");
}
