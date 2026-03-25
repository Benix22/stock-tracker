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

    const genAI = new GoogleGenerativeAI(apiKey);
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

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("AI Community Summary Error:", error);
    return "The community is actively discussing this asset, but we couldn't generate a summary at this moment.";
  }
}
