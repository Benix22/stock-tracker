"use server"

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCommentsBySymbol } from "./comments-db";

export async function getCommunitySummary(symbol: string) {
  try {
    const comments: any[] = await getCommentsBySymbol(symbol);
    
    if (comments.length < 2) return null; 

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("AI Community Summary: Missing API Key");
        return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey.trim());
    // Usamos el modelo disponible en tu proyecto: gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const commentsText = comments
      .slice(0, 30)
      .map((c: any) => `[Sentiment: ${c.sentiment}] User: ${c.userFullName}: ${c.content}`)
      .join("\n");

    const prompt = `
      You are a stock market community analyst.
      Analyze these comments for ${symbol} and provide a 2-sentence summary of the general sentiment and key topics discussed by the users.
      Be objective and capture the overall "vibe" of the community.
      Output ONLY the 2 sentences.

      COMMENTS:
      ${commentsText}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text || "There is active discussion about this asset with mixed opinions from the community.";
  } catch (error: any) {
    console.error("AI Community Summary Error:", error.message);
    return "The community is actively discussing this asset, but we couldn't generate a summary at this moment.";
  }
}
