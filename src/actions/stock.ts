"use server"

import { getStockQuote, getStockHistory, getIntradayData as getIntradayDataApi, getBatchStockQuotes as getBatchStockQuotesApi, StockData, HistoricalDataPoint, IntradayResult } from "@/lib/stock-api";

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

export async function getStockHistoryWithRange(symbol: string, from: string, to: string): Promise<HistoricalDataPoint[]> {
    return await getStockHistory(symbol, from, to);
}

export async function getBatchStockQuotes(symbols: string[]): Promise<StockData[]> {
    return await getBatchStockQuotesApi(symbols);
}
