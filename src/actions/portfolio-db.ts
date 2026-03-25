"use server"

import { db } from "@/db";
import { positions } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPositions() {
  const { userId } = await auth();
  const cleanId = userId?.trim();
  
  console.log("Fetching positions for user:", cleanId);
  
  if (!cleanId) {
    console.log("No userId found, returning empty array.");
    return [];
  }
  
  const results = await db.query.positions.findMany({
    where: eq(positions.userId, cleanId),
    orderBy: (positions, { desc }) => [desc(positions.createdAt)]
  });
  
  console.log(`Found ${results.length} positions in DB for ${cleanId}.`);
  return results;
}

export async function addOrUpdatePosition({ symbol, shares, avgPrice }: { symbol: string, shares: number, avgPrice: number }) {
  const { userId } = await auth();
  const cleanId = userId?.trim();

  console.log("Adding position for user:", cleanId);
  
  if (!cleanId) {
    console.error("Unauthorized: no userId found");
    throw new Error("Unauthorized");
  }

  const existing = await db.query.positions.findFirst({
    where: and(eq(positions.userId, cleanId), eq(positions.symbol, symbol.toUpperCase()))
  });

  if (existing) {
    console.log("Updating existing position:", existing.id);
    const totalShares = existing.shares + shares;
    const newAvgPrice = (existing.shares * existing.avgPrice + shares * avgPrice) / totalShares;
    
    await db.update(positions)
      .set({ shares: totalShares, avgPrice: newAvgPrice })
      .where(eq(positions.id, existing.id));
  } else {
    console.log("Inserting new position for:", symbol);
    await db.insert(positions).values({
      userId: cleanId,
      symbol: symbol.toUpperCase(),
      shares,
      avgPrice,
    });
  }
  console.log("Success! Revalidating path.");
  revalidatePath("/portfolio");
}

export async function deletePosition(id: string) {
  const { userId } = await auth();
  const cleanId = userId?.trim();
  
  if (!cleanId) throw new Error("Unauthorized");

  await db.delete(positions)
    .where(and(eq(positions.id, id), eq(positions.userId, cleanId)));
    
  revalidatePath("/portfolio");
}
