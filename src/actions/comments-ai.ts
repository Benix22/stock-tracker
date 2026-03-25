"use server"

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCommentsBySymbol } from "./comments-db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function getCommunitySummary(symbol: string) {
  try {
    const comments = await getCommentsBySymbol(symbol);
    
    if (comments.length < 3) return null; // Only summarize if there's enough discussion

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const commentsText = comments
      .slice(0, 20)
      .map((c: any) => `[${c.sentiment}] ${c.content}`)
      .join("\n");

    const prompt = `
      Analyze the following community comments about the stock ${symbol}.
      Provide a concise 2-sentence summary of the general community mood and the main points of discussion.
      The tone should be professional yet capturing the community vibe.
      Output ONLY the 2 sentences, no labels or formatting.

      Comments:
      ${commentsText}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("AI Summary failed", error);
    return null;
  }
}
