"use server"

import { db } from "@/db";
import { positions } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPositions() {
  const { userId } = await auth();
  if (!userId) return [];
  
  return await db.query.positions.findMany({
    where: eq(positions.userId, userId),
    orderBy: (positions, { desc }) => [desc(positions.createdAt)]
  });
}

export async function addOrUpdatePosition({ symbol, shares, avgPrice }: { symbol: string, shares: number, avgPrice: number }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await db.query.positions.findFirst({
    where: and(eq(positions.userId, userId), eq(positions.symbol, symbol.toUpperCase()))
  });

  if (existing) {
    const totalShares = existing.shares + shares;
    const newAvgPrice = (existing.shares * existing.avgPrice + shares * avgPrice) / totalShares;
    
    await db.update(positions)
      .set({ shares: totalShares, avgPrice: newAvgPrice })
      .where(eq(positions.id, existing.id));
  } else {
    await db.insert(positions).values({
      userId,
      symbol: symbol.toUpperCase(),
      shares,
      avgPrice,
    });
  }
  revalidatePath("/portfolio");
}

export async function deletePosition(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(positions)
    .where(and(eq(positions.id, id), eq(positions.userId, userId)));
    
  revalidatePath("/portfolio");
}
