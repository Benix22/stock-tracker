import Alpaca from "@alpacahq/alpaca-trade-api";

const apiKey = process.env.ALPACA_API_KEY || '';
const isPaper = apiKey.startsWith('PK');

export const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
  paper: isPaper,
});

export async function getRealTimeQuote(symbol: string) {
  try {
    const cleanSymbol = symbol.toUpperCase().split('.')[0]; 
    const snapshot: any = await alpaca.getSnapshot(cleanSymbol);
    if (!snapshot || !snapshot.latestTrade || !snapshot.dailyBar || !snapshot.prevDailyBar) {
      console.warn(`Alpaca: Incomplete snapshot for ${symbol}`);
      return null;
    }

    return {
      price: snapshot.latestTrade.p,
      change: snapshot.dailyBar.c - snapshot.prevDailyBar.c,
      changePercent: snapshot.prevDailyBar.c !== 0 ? ((snapshot.dailyBar.c - snapshot.prevDailyBar.c) / snapshot.prevDailyBar.c) * 100 : 0,
      timestamp: snapshot.latestTrade.t,
    };
  } catch (error) {
    console.warn(`Alpaca: Snapshot failed for ${symbol}`, error);
    return null;
  }
}

export async function getBatchRealTimeQuotes(symbols: string[]) {
    try {
        const cleanSymbols = symbols.map(s => s.toUpperCase().split('.')[0]);
        const snapshots: any = await alpaca.getSnapshots(cleanSymbols);
        
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
  try {
    const clock = await alpaca.getClock();
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
    try {
        const cleanSymbol = symbol.toUpperCase().split('.')[0];
        const bars = [];
        
        // Ensure valid timeframe format for Alpaca (e.g. '1Min', '5Min', '1Day')
        const resp = alpaca.getBarsV2(cleanSymbol, {
            start,
            end,
            timeframe,
            limit: 5000,
            feed: 'iex', // IEX feed for free tier compatibility
        });
        
        for await (const bar of resp) {
            bars.push({
                date: new Date(bar.Timestamp as string).toISOString(), // Ensure ISO string format
                open: bar.OpenPrice,
                high: bar.HighPrice,
                low: bar.LowPrice,
                close: bar.ClosePrice,
                volume: bar.Volume,
            });
        }
        
        return bars;
    } catch (error) {
         console.warn(`Alpaca: Failed to get historical bars for ${symbol}`, error);
         return [];
    }
}
