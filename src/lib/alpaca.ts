import Alpaca from "@alpacahq/alpaca-trade-api";

const isPaper = process.env.ALPACA_PAPER === "true";

export const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
  paper: isPaper,
});

export async function getRealTimeQuote(symbol: string) {
  try {
    const cleanSymbol = symbol.toUpperCase().split('.')[0]; 
    const snapshot: any = await alpaca.getSnapshot(cleanSymbol);
    if (!snapshot) return null;

    return {
      price: snapshot.latestTrade.p,
      change: snapshot.dailyBar.c - snapshot.prevDailyBar.c,
      changePercent: ((snapshot.dailyBar.c - snapshot.prevDailyBar.c) / snapshot.prevDailyBar.c) * 100,
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
        
        return Object.entries(snapshots).map(([symbol, snapshot]: [string, any]) => ({
            symbol,
            price: snapshot.latestTrade.p,
            change: snapshot.dailyBar.c - snapshot.prevDailyBar.c,
            changePercent: ((snapshot.dailyBar.c - snapshot.prevDailyBar.c) / snapshot.prevDailyBar.c) * 100,
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
