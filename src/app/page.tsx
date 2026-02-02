import { StockDashboard } from "@/components/StockDashboard";
import { Watchlist } from "@/components/Watchlist";
import { getStockQuote, getStockHistory, getMarketMovers } from "@/lib/stock-api";
import { MarketMovers } from "@/components/MarketMovers";

export const revalidate = 60; // Revalidate every minute

export default async function Dashboard() {
  const symbols = ['SGHC', 'NVDA', 'MSFT', 'GOOGL'];

  // Fetch initial data
  const [stocksData, gainers, losers] = await Promise.all([
    Promise.all(
      symbols.map(async (sym) => {
        const [quote, history] = await Promise.all([
          getStockQuote(sym),
          getStockHistory(sym)
        ]);
        return { symbol: sym, quote, history };
      })
    ),
    getMarketMovers('day_gainers'),
    getMarketMovers('day_losers')
  ]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <StockDashboard initialStocks={stocksData} />
          </div>
          <div className="space-y-6">
            <Watchlist />
            <MarketMovers movers={gainers} />
            <MarketMovers movers={losers} title="Top Losers (US)" type="losers" />
          </div>
        </div>
      </div>
    </div>
  );
}
