"use server"

import { db } from "@/db";
import { comments, positions } from "@/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, desc, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCommentsBySymbol(symbol: string) {
  const cleanSymbol = symbol.toUpperCase();
  
  const allComments = await db.query.comments.findMany({
    where: eq(comments.symbol, cleanSymbol),
    orderBy: [desc(comments.createdAt)]
  });

  if (allComments.length === 0) return [];

  const userIds = Array.from(new Set(allComments.map(c => c.userId)));
  
  const holders = await db.query.positions.findMany({
    where: and(
      inArray(positions.userId, userIds),
      eq(positions.symbol, cleanSymbol)
    )
  });

  const holderSet = new Set(holders.map(h => h.userId));

  return allComments.map(c => ({
    ...c,
    isHolder: holderSet.has(c.userId)
  }));
}

export async function addComment({ symbol, content, sentiment }: { 
  symbol: string, 
  content: string, 
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" 
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await currentUser();
  const fullName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Anonymous User";
  const imageUrl = user?.imageUrl || "";

  await db.insert(comments).values({
    userId: userId.trim(),
    userFullName: fullName,
    userImageUrl: imageUrl,
    symbol: symbol.toUpperCase(),
    content,
    sentiment,
  });

  revalidatePath(`/stock/${symbol}`);
}

export async function deleteComment(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(comments)
    .where(and(eq(comments.id, id), eq(comments.userId, userId.trim())));
    
  revalidatePath("/");
}
