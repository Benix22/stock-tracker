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
            Actúa como un experto analista financiero de Wall Street.
            Analiza la acción ${symbol} (${quote.name}). 
            Su precio actual es $${quote.price}.
            Datos fundamentales clave:
            - Market Cap: ${quote.marketCap || 'N/A'}
            - PE Ratio: ${quote.trailingPE || 'N/A'}
            - 52 Week High: ${quote.fiftyTwoWeekHigh || 'N/A'}
            - 52 Week Low: ${quote.fiftyTwoWeekLow || 'N/A'}
            
            Histórico reciente de 30 días (fecha, cierre, volumen):
            ${JSON.stringify(recentHistory)}
            
            Evalúa estos datos usando análisis técnico básico y principios fundamentales.
            Devuelve tu respuesta estrictamente en este formato JSON exacto (sin texto adicional ni bloques markdown markdown, solo el objeto JSON validado):
            {
              "signal": "BUY" | "SELL" | "HOLD",
              "confidence": número entero del 1 al 100 representando tu nivel de confianza,
              "reasoning": "Breve explicación en español de máximo 3 líneas indicando por qué tomas esta decisión basados en las tendencias observadas."
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
