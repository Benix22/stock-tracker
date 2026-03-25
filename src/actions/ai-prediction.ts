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

        const genAI = new GoogleGenerativeAI(apiKey);
        // Usamos el modelo gemini-2.5-flash ya que no sabemos qué versiones exactas están disponibles
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Fetch recent data using the existing action
        const { quote, history } = await fetchStockData(symbol);
        
        if (!quote) return null;

        // Take last 30 days of history to avoid massive payloads
        const recentHistory = history.slice(-30).map(h => ({
            date: h.date,
            close: h.close,
            volume: h.volume
        }));

        const prompt = `
            Act as an expert Wall Street financial analyst.
            Analyze the stock ${symbol} (${quote.name}). 
            Its current price is $${quote.price}.
            Key fundamental data:
            - Market Cap: ${quote.marketCap || 'N/A'}
            - PE Ratio: ${quote.trailingPE || 'N/A'}
            - 52 Week High: ${quote.fiftyTwoWeekHigh || 'N/A'}
            - 52 Week Low: ${quote.fiftyTwoWeekLow || 'N/A'}
            
            Recent 30-day history (date, close, volume):
            ${JSON.stringify(recentHistory)}
            
            Evaluate this data using basic technical analysis and fundamental principles.
            Return your response strictly in this exact JSON format (no additional text or markdown blocks, just the validated JSON object):
            {
              "signal": "BUY" | "SELL" | "HOLD",
              "confidence": integer from 1 to 100 representing your confidence level,
              "reasoning": "Brief explanation in English of maximum 3 lines indicating why you made this decision based on observed trends."
            }
        `;

        const resultFromAi = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const content = resultFromAi.response.text();
        if (!content) return null;

        const result: PredictionResult = JSON.parse(content);
        return result;
    } catch (error) {
        console.error("AI Prediction Error:", error);
        return null; 
    }
}
