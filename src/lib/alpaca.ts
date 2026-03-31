/**
 * Alpaca API Client (Native Fetch Implementation)
 * Reason: The official @alpacahq/alpaca-trade-api uses the deprecated url.parse() 
 * which triggers security warnings in Node.js 20+. 
 * This native implementation uses the modern WHATWG URL API.
 */

const apiKey = process.env.ALPACA_API_KEY || '';
const secretKey = process.env.ALPACA_SECRET_KEY || '';
const isPaper = apiKey.startsWith('PK');

const API_BASE_URL = isPaper 
    ? "https://paper-api.alpaca.markets/v2" 
    : "https://api.alpaca.markets/v2";

const DATA_BASE_URL = "https://data.alpaca.markets/v2";

const headers = {
    'APCA-API-KEY-ID': apiKey,
    'APCA-API-SECRET-KEY': secretKey,
    'Accept': 'application/json'
};

export async function getRealTimeQuote(symbol: string) {
    if (!apiKey || !secretKey) return null;

    try {
        const cleanSymbol = symbol.toUpperCase().split('.')[0];
        const url = new URL(`${DATA_BASE_URL}/stocks/${cleanSymbol}/snapshot`);
        
        const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
        if (!response.ok) return null;

        const data: any = await response.json();
        
        // Alpaca Snapshot V2 structure
        if (!data || !data.latestTrade || !data.dailyBar || !data.prevDailyBar) {
            console.warn(`Alpaca: Incomplete snapshot for ${symbol}`);
            return null;
        }

        return {
            price: data.latestTrade.p,
            change: data.dailyBar.c - data.prevDailyBar.c,
            changePercent: data.prevDailyBar.c !== 0 ? ((data.dailyBar.c - data.prevDailyBar.c) / data.prevDailyBar.c) * 100 : 0,
            timestamp: data.latestTrade.t,
        };
    } catch (error) {
        console.warn(`Alpaca: Snapshot failed for ${symbol}`, error);
        return null;
    }
}

export async function getBatchRealTimeQuotes(symbols: string[]) {
    if (!apiKey || !secretKey || symbols.length === 0) return [];

    try {
        const cleanSymbols = symbols.map(s => s.toUpperCase().split('.')[0]).join(',');
        const url = new URL(`${DATA_BASE_URL}/stocks/snapshots`);
        url.searchParams.append('symbols', cleanSymbols);
        
        const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
        if (!response.ok) return [];

        const snapshots: any = await response.json();
        
        return Object.entries(snapshots)
            .filter(([_, snapshot]: [string, any]) => snapshot && snapshot.latestTrade && snapshot.dailyBar && snapshot.prevDailyBar)
            .map(([symbol, snapshot]: [string, any]) => ({
                symbol,
                price: snapshot.latestTrade.p,
                change: snapshot.dailyBar.c - snapshot.prevDailyBar.c,
                changePercent: snapshot.prevDailyBar.c !== 0 ? ((snapshot.dailyBar.c - snapshot.prevDailyBar.c) / snapshot.prevDailyBar.c) * 100 : 0,
                timestamp: snapshot.latestTrade.t,
            }));
    } catch (error) {
        console.error("Alpaca: Batch snapshots failed", error);
        return [];
    }
}

export async function getMarketStatus() {
    if (!apiKey || !secretKey) return null;

    try {
        const url = new URL(`${API_BASE_URL}/clock`);
        const response = await fetch(url.toString(), { headers });
        if (!response.ok) return null;

        const clock = await response.json();
        return {
            isOpen: clock.is_open,
            nextOpen: clock.next_open,
            nextClose: clock.next_close,
            timestamp: clock.timestamp,
        };
    } catch (error) {
        console.error("Alpaca: Failed to get market status", error);
        return null;
    }
}

export async function getHistoricalBars(symbol: string, timeframe: string, start: string, end: string) {
    if (!apiKey || !secretKey) return [];

    try {
        const cleanSymbol = symbol.toUpperCase().split('.')[0];
        const url = new URL(`${DATA_BASE_URL}/stocks/${cleanSymbol}/bars`);
        url.searchParams.append('timeframe', timeframe);
        url.searchParams.append('start', start);
        url.searchParams.append('end', end);
        url.searchParams.append('limit', '5000');
        url.searchParams.append('feed', 'iex');

        const response = await fetch(url.toString(), { headers });
        if (!response.ok) return [];

        const data = await response.json();
        const bars = data.bars || [];
        
        return bars.map((bar: any) => ({
            date: new Date(bar.t).toISOString(),
            open: bar.o,
            high: bar.h,
            low: bar.l,
            close: bar.c,
            volume: bar.v,
        }));
    } catch (error) {
        console.warn(`Alpaca: Failed to get historical bars for ${symbol}`, error);
        return [];
    }
}
