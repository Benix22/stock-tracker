import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Crypto Markets",
};

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
}

async function getCryptoData(): Promise<CryptoData[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false", {
      next: { revalidate: 60 },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) throw new Error("Failed to fetch crypto data");
    return res.json();
  } catch (error) {
    console.error("Crypto fetch failed or timed out:", error);
    return [];
  }
}

function formatCurrency(value: number) {
  if (value === null || value === undefined) return "N/A";
  if (value >= 1e12) return (value / 1e12).toFixed(2) + " T";
  if (value >= 1e9) return (value / 1e9).toFixed(2) + " B";
  if (value >= 1e6) return (value / 1e6).toFixed(2) + " M";
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function formatSupply(value: number) {
  if (value === null || value === undefined) return "N/A";
  if (value >= 1e9) return (value / 1e9).toFixed(2) + " B";
  if (value >= 1e6) return (value / 1e6).toFixed(2) + " M";
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export default async function CryptoPage() {
  const data = await getCryptoData();

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 animate-in fade-in duration-700">
      <div className="w-full max-w-[1600px] mx-auto space-y-6">
        <h1 className="text-3xl font-black tracking-tight mb-6">Cryptocurrency Prices by Market Cap</h1>
        
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-muted-foreground border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-4 min-w-[200px] font-medium">Instrument</th>
                <th className="px-3 py-4 text-center font-medium">↑ Rank</th>
                <th className="px-4 py-4 text-right font-medium">Price</th>
                <th className="px-4 py-4 text-right font-medium leading-tight">Change %<br/>24h</th>
                <th className="px-4 py-4 text-right font-medium leading-tight">Market<br/>cap</th>
                <th className="px-4 py-4 text-right font-medium leading-tight">Volume<br/>24h</th>
                <th className="px-4 py-4 text-right font-medium leading-tight">Circ<br/>supply</th>
                <th className="px-4 py-4 text-right font-medium leading-tight">Vol /<br/>Market Cap</th>
                <th className="px-4 py-4 text-left font-medium min-w-[150px]">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((coin) => (
                <tr key={coin.id} className="hover:bg-muted/50 transition-colors group">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-7 h-7 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        <Image src={coin.image} alt={coin.name} fill className="object-cover" />
                      </div>
                      <span className="bg-muted text-foreground text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {coin.symbol}
                      </span>
                      <Link 
                        href={`/stock/${coin.symbol.toUpperCase()}-USD`}
                        className="font-semibold text-foreground/80 hover:text-primary hover:underline transition-colors truncate"
                      >
                        {coin.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center text-muted-foreground font-bold text-xs">
                    {coin.market_cap_rank}
                  </td>
                  <td className="px-4 py-4 text-right font-bold tabular-nums">
                    {formatCurrency(coin.current_price)} <span className="text-[9px] text-muted-foreground font-bold uppercase ml-0.5">USD</span>
                  </td>
                  <td className={`px-4 py-4 text-right font-bold tabular-nums ${coin.price_change_percentage_24h >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {coin.price_change_percentage_24h > 0 ? "+" : ""}{coin.price_change_percentage_24h?.toFixed(2)}%
                  </td>
                  <td className="px-4 py-4 text-right font-semibold tabular-nums text-foreground/80">
                    {formatCurrency(coin.market_cap)} <span className="text-[9px] text-muted-foreground font-bold uppercase ml-0.5">USD</span>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold tabular-nums text-foreground/80">
                    {formatCurrency(coin.total_volume)} <span className="text-[9px] text-muted-foreground font-bold uppercase ml-0.5">USD</span>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold tabular-nums text-foreground/80">
                    {formatSupply(coin.circulating_supply)} <span className="text-[9px] text-muted-foreground font-bold uppercase ml-0.5">{coin.symbol}</span>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold tabular-nums text-muted-foreground">
                    {coin.market_cap > 0 ? (coin.total_volume / coin.market_cap).toFixed(4) : "N/A"}
                  </td>
                  <td className="px-4 py-4 text-left text-muted-foreground text-xs truncate max-w-[200px]">
                    {coin.symbol === 'btc' ? 'Cryptocurrencies, Layer 1' : 
                     coin.symbol === 'eth' ? 'Smart contract platforms' : 
                     coin.symbol === 'usdt' || coin.symbol === 'usdc' ? 'Stablecoins' : 'Cryptocurrencies'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
