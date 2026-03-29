"use server"

import { db } from "@/db";
import { leagues, leagueParticipants, leaguePositions } from "@/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getOrCreateCurrentLeague() {
  const now = new Date();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const year = now.getFullYear().toString();

  // Find if already exists
  let current = await db.query.leagues.findFirst({
    where: and(eq(leagues.month, month), eq(leagues.year, year), eq(leagues.status, "ACTIVE"))
  });

  if (!current) {
    // Check if there are other active leagues that should be COMPLETED
    // (Simplification: just create the current one)
    const [inserted] = await db.insert(leagues).values({
      month,
      year,
      status: "ACTIVE"
    }).returning();
    current = inserted;
  }

  return current;
}

export async function joinLeague() {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId) throw new Error("Unauthorized");

  const league = await getOrCreateCurrentLeague();

  // Check if already in
  const existing = await db.query.leagueParticipants.findFirst({
    where: and(eq(leagueParticipants.userId, userId), eq(leagueParticipants.leagueId, league.id))
  });

  if (existing) return existing;

  // Add participant
  const [participant] = await db.insert(leagueParticipants).values({
    leagueId: league.id,
    userId: userId,
    userFullName: user?.fullName || "Trader",
    userImageUrl: user?.imageUrl,
    cashBalance: 100000,
  }).returning();

  revalidatePath("/league");
  return participant;
}

export async function getLeagueParticipant() {
  const { userId } = await auth();
  if (!userId) return null;

  const league = await getOrCreateCurrentLeague();
  
  return await db.query.leagueParticipants.findFirst({
    where: and(eq(leagueParticipants.userId, userId), eq(leagueParticipants.leagueId, league.id))
  });
}

export async function getLeaguePositions(participantId: string) {
  return await db.query.leaguePositions.findMany({
    where: eq(leaguePositions.participantId, participantId)
  });
}

export async function getLeagueLeaderboard() {
  const league = await getOrCreateCurrentLeague();
  
  const participants = await db.query.leagueParticipants.findMany({
    where: eq(leagueParticipants.leagueId, league.id),
  });

  if (participants.length === 0) return [];

  // Correction: Positions join via participantId
  const positionsWithParticipant = await db.select().from(leaguePositions)
    .innerJoin(leagueParticipants, eq(leaguePositions.participantId, leagueParticipants.id))
    .where(eq(leagueParticipants.leagueId, league.id));

  // Get unique symbols
  const allSymbols = [...new Set(positionsWithParticipant.map(p => p.league_positions.symbol))];
  
  let quotesMap: Record<string, number> = {};
  if (allSymbols.length > 0) {
    const { getBatchStockQuotes } = await import("@/actions/stock");
    const quotes = await getBatchStockQuotes(allSymbols);
    quotes.forEach(q => quotesMap[q.symbol] = q.price);
  }

  const results = participants.map(p => {
    const userPositions = positionsWithParticipant.filter(pos => pos.league_participants.id === p.id);
    const stockValue = userPositions.reduce((acc, pos) => {
      const price = quotesMap[pos.league_positions.symbol] || pos.league_positions.avgPrice;
      return acc + (pos.league_positions.shares * price);
    }, 0);
    
    return {
      ...p,
      totalValue: p.cashBalance + stockValue,
      profitPct: ((p.cashBalance + stockValue - 100000) / 100000) * 100
    };
  });

  return results.sort((a, b) => b.totalValue - a.totalValue);
}

export async function executeLeagueTrade({ participantId, symbol, shares, price, type }: { participantId: string, symbol: string, shares: number, price: number, type: 'BUY' | 'SELL' }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const participant = await db.query.leagueParticipants.findFirst({
    where: eq(leagueParticipants.id, participantId)
  });

  if (!participant || participant.userId !== userId) throw new Error("Unauthorized or not in league");

  const totalCost = shares * price;

  if (type === 'BUY') {
    if (participant.cashBalance < totalCost) throw new Error("Insufficient cash");

    // Check existing position
    const existing = await db.query.leaguePositions.findFirst({
      where: and(eq(leaguePositions.participantId, participantId), eq(leaguePositions.symbol, symbol.toUpperCase()))
    });

    if (existing) {
      const newShares = existing.shares + shares;
      const newAvg = (existing.shares * existing.avgPrice + totalCost) / newShares;
      await db.update(leaguePositions).set({ shares: newShares, avgPrice: newAvg }).where(eq(leaguePositions.id, existing.id));
    } else {
      await db.insert(leaguePositions).values({ participantId, symbol: symbol.toUpperCase(), shares, avgPrice: price });
    }

    await db.update(leagueParticipants).set({ cashBalance: participant.cashBalance - totalCost }).where(eq(leagueParticipants.id, participantId));
  } else {
    // SELL
    const existing = await db.query.leaguePositions.findFirst({
      where: and(eq(leaguePositions.participantId, participantId), eq(leaguePositions.symbol, symbol.toUpperCase()))
    });

    if (!existing || existing.shares < shares) throw new Error("Insufficient shares");

    const newShares = existing.shares - shares;
    if (newShares === 0) {
      await db.delete(leaguePositions).where(eq(leaguePositions.id, existing.id));
    } else {
      await db.update(leaguePositions).set({ shares: newShares }).where(eq(leaguePositions.id, existing.id));
    }

    await db.update(leagueParticipants).set({ cashBalance: participant.cashBalance + totalCost }).where(eq(leagueParticipants.id, participantId));
  }

  revalidatePath("/league");
  revalidatePath(`/stock/${symbol}`);
}
