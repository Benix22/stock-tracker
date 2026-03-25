"use server"

import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchStockData } from '@/actions/stock';

export type PredictionResult = {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
}

export async function getAIPrediction(symbol: string): Promise<PredictionResult | null> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("No GEMINI_API_KEY found in environment.");
            return null;
        }

        const genAI = new GoogleGenerativeAI(apiKey.trim());
        // Usamos el modelo disponible en tu proyecto: gemini-2.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const { quote, history } = await fetchStockData(symbol);
        
        if (!quote) {
            console.error(`AI Prediction: No data found for ${symbol}`);
            return null;
        }

        const recentHistory = history.slice(-30).map(h => ({
            date: h.date,
            close: h.close,
            volume: h.volume
        }));

        const prompt = `
            Act as an expert Wall Street financial analyst.
            Analyze the stock ${symbol} (${quote.name}). 
            Current price: $${quote.price}.
            Metrics: PE=${quote.trailingPE || 'N/A'}, MktCap=${quote.marketCap || 'N/A'}.
            Recent History: ${JSON.stringify(recentHistory)}
            
            Return strictly a JSON object:
            {
              "signal": "BUY" | "SELL" | "HOLD",
              "confidence": number 1-100,
              "reasoning": "string"
            }
        `;

        const result = await model.generateContent(prompt);
        const content = result.response.text().trim();
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("AI Prediction: AI did not return a JSON object", content);
            return null;
        }
        
        const res: PredictionResult = JSON.parse(jsonMatch[0]);
        return res;
    } catch (error: any) {
        console.error("AI Prediction Error Details:", error.message);
        return null; 
    }
}
