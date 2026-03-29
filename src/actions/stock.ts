"use server"

import { getStockQuote, getStockHistory, getIntradayData as getIntradayDataApi, getBatchStockQuotes as getBatchStockQuotesApi, getStockProfile as getStockProfileApi, getStockCalendar as getStockCalendarApi, getBatchStockCalendar as getBatchStockCalendarApi, getStockNews, StockData, HistoricalDataPoint, IntradayResult, StockProfile, CalendarEvent } from "@/lib/stock-api";
import { getHistoricalBars as getAlpacaHistoricalBarsApi } from "@/lib/alpaca";

export interface StockResult {
    quote: StockData | null;
    history: HistoricalDataPoint[];
}

export async function fetchStockData(symbol: string): Promise<StockResult> {
    const [quote, history] = await Promise.all([
        getStockQuote(symbol),
        getStockHistory(symbol)
    ]);

    return { quote, history };
}

export async function getIntradayData(symbol: string): Promise<IntradayResult | null> {
    return await getIntradayDataApi(symbol);
}

export async function getStockHistoryWithRange(
    symbol: string,
    from: string,
    to: string,
    interval?: '1m' | '5m' | '15m' | '30m' | '60m' | '1h' | '1d' | '1wk' | '1mo'
): Promise<HistoricalDataPoint[]> {
    return await getStockHistory(symbol, from, to, interval);
}

export async function getBatchStockQuotes(symbols: string[]): Promise<StockData[]> {
    return await getBatchStockQuotesApi(symbols);
}

export async function getStockProfile(symbol: string): Promise<StockProfile | null> {
    return await getStockProfileApi(symbol);
}

export async function getAlpacaHistoricalBars(
    symbol: string,
    timeframe: string,
    start: string,
    end: string
): Promise<HistoricalDataPoint[]> {
    return await getAlpacaHistoricalBarsApi(symbol, timeframe, start, end);
}


export async function fetchStockQuote(symbol: string): Promise<StockData | null> {
    return await getStockQuote(symbol);
}

export async function getAlpacaConfig() {
    return {
        keyId: process.env.ALPACA_API_KEY,
        secretKey: process.env.ALPACA_SECRET_KEY,
        paper: (process.env.ALPACA_API_KEY || '').startsWith('PK')
    };
}

export async function fetchStockCalendar(symbol: string): Promise<CalendarEvent[]> {
    return await getStockCalendarApi(symbol);
}

export async function fetchAIStockEvents(symbol: string): Promise<CalendarEvent[]> {
    try {
        const [news, profile] = await Promise.all([
            getStockNews(symbol),
            getStockProfileApi(symbol)
        ]);

        if (!news || news.length === 0) return [];

        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const newsHeadlines = news.map(n => `- ${n.publisher} (${new Date(n.providerPublishTime).toLocaleDateString()}): ${n.title}`).join('\n');

        const prompt = `
        Analyze the following news headlines for the stock ${symbol} (${profile?.sector || ''}) and extract any UPCOMING or VERY RECENT SIGNIFICANT events (must be from today onwards), especially:
        - Upcoming Earnings Guidance / Results
        - Future Mergers & Acquisitions (announced or rumored)
        - Future Product Launches or Clinical Trial results (FDA)
        - Upcoming Management / Leadership Changes (CEO/CFO)
        - Major Legal or Regulatory actions with a future deadline
        
        Return ONLY a JSON array of objects with this structure:
        [{"type": "Earnings" | "Dividend" | "Split" | "Other", "date": "ISO-date", "title": "short title", "description": "1 sentence explanation"}]
        
        Only include events that have NOT passed yet (today is ${new Date().toLocaleDateString()}).
        If an event has a clear date in the headline, use it. If not, use the publish date.
        If no future significant events are found, return [].
        
        News headlining are recent, so if they talk about a future event, use that date.
        
        News:\n${newsHeadlines}
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const raw = JSON.parse(jsonMatch[0]);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return raw.filter((e: any) => new Date(e.date) >= today);
        }
        return [];
    } catch (e) {
        console.error("AI Event Extraction failed", e);
        return [];
    }
}

export async function fetchBatchStockCalendar(symbols: string[]): Promise<CalendarEvent[]> {
    return await getBatchStockCalendarApi(symbols);
}
