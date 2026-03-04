"use server"

import { getStockQuote, getStockHistory, getIntradayData as getIntradayDataApi, getBatchStockQuotes as getBatchStockQuotesApi, getStockProfile as getStockProfileApi, StockData, HistoricalDataPoint, IntradayResult, StockProfile } from "@/lib/stock-api";

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
