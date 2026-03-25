"use server"

import { db } from "@/db";
import { comments } from "@/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCommentsBySymbol(symbol: string) {
  const cleanSymbol = symbol.toUpperCase();
  
  // Use raw SQL to include holder status
  const res = await db.execute(sql`
    SELECT 
      c.id, 
      c.user_id as "userId", 
      c.user_full_name as "userFullName", 
      c.user_image_url as "userImageUrl", 
      c.symbol, 
      c.content, 
      c.sentiment, 
      c.created_at as "createdAt",
      EXISTS (
        SELECT 1 FROM positions p 
        WHERE p.user_id = c.user_id 
        AND UPPER(p.symbol) = UPPER(c.symbol)
      ) as "isHolder"
    FROM comments c
    WHERE UPPER(c.symbol) = ${cleanSymbol}
    ORDER BY c.created_at DESC
  `);

  return res.rows;
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
