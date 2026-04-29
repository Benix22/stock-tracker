import { StockDashboard } from "@/components/StockDashboard";
import { Watchlist } from "@/components/Watchlist";
import { getBatchStockQuotes, getStockHistory, getMarketMovers } from "@/lib/stock-api";
import { MarketMovers } from "@/components/MarketMovers";
import { MarketCalendar } from "@/components/MarketCalendar";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { INDICES_CONFIG, OVERVIEW_SYMBOLS, DASHBOARD_SYMBOLS } from "@/lib/constants";

export const revalidate = 60; // Revalidate every minute

export default async function Dashboard() {
  const dashSymbols = DASHBOARD_SYMBOLS;
  const indexSymbols = INDICES_CONFIG.map(i => i.symbol);
  
  // Combine all symbols for a single batch fetch
  const allSymbols = Array.from(new Set([...dashSymbols, ...indexSymbols, ...OVERVIEW_SYMBOLS]));

  // 1. Fetch EVERYTHING in parallel (Quotes, Histories, Movers)
  const [allQuotes, stocksHistory, gainers, losers] = await Promise.all([
    getBatchStockQuotes(allSymbols),
    Promise.all(dashSymbols.map(sym => getStockHistory(sym))),
    getMarketMovers('day_gainers'),
    getMarketMovers('day_losers')
  ]);
  
  // 2. Map quotes back to their respective groups
  const dashQuotes = dashSymbols.map(sym => allQuotes.find(q => q?.symbol === sym) || null);
  const indexQuotes = INDICES_CONFIG.map(config => {
      const quote = allQuotes.find(q => q?.symbol === config.symbol);
      return { ...config, ...(quote || { price: 0, change: 0, changePercent: 0, symbol: config.symbol, name: config.name }) };
  });
  const overviewQuotes = OVERVIEW_SYMBOLS.map(sym => allQuotes.find(q => q?.symbol === sym) || null);

  // 3. Combine quotes with histories
  const stocksDataWithHistory = dashSymbols.map((sym, i) => ({
      symbol: sym,
      quote: dashQuotes[i],
      history: stocksHistory[i]
  }));

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <StockDashboard 
                initialStocks={stocksDataWithHistory} 
                initialIndices={indexQuotes as any}
                initialOverviewQuotes={overviewQuotes}
            />
          </div>
          <div className="space-y-6">
            <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
              <MarketCalendar />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <Watchlist />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <MarketMovers movers={gainers} />
              <MarketMovers movers={losers} title="Top Losers (US)" type="losers" />
            </Suspense>
            <SpeedInsights />
          </div>
        </div>
      </div>
    </div>
  );
}


