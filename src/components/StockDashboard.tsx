"use client"

import { useState, useEffect } from "react";
import { StockData, HistoricalDataPoint } from "@/lib/stock-api";
import { StockCard } from "@/components/StockCard";
import { StockChart } from "@/components/StockChart";
import { fetchStockData, getBatchStockQuotes } from "@/actions/stock";
import { SearchHistoryInput } from "@/components/SearchHistoryInput";
import { getSearchHistory, addToSearchHistory } from "@/actions/history";

import { MarketOverviewCards } from "@/components/MarketOverviewCards";
import { WorldIndices } from "@/components/WorldIndices";
import Link from "next/link";
import { ChevronRight, LineChart, Briefcase } from "lucide-react";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";

interface StockDashboardProps {
    initialStocks: {
        symbol: string;
        quote: StockData | null;
        history: HistoricalDataPoint[];
    }[];
}

export function StockDashboard({ initialStocks }: StockDashboardProps) {
    const [stocks, setStocks] = useState(initialStocks);
    const [history, setHistory] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const { isSignedIn, isLoaded } = useUser();

    useEffect(() => {
        getSearchHistory().then(setHistory);
    }, []);

    // Real-time updates with stable interval
    useEffect(() => {
        const interval = setInterval(async () => {
            // Need latest symbols - can use setStocks with functional update to read latest without triggering re-run
            let currentSymbols: string[] = [];
            setStocks(prev => {
                currentSymbols = prev.map(s => s.symbol).filter(Boolean);
                return prev;
            });

            if (currentSymbols.length === 0) return;

            try {
                const updatedQuotes = await getBatchStockQuotes(currentSymbols);
                setStocks(prevStocks => prevStocks.map(s => {
                    const newQuote = updatedQuotes.find(q => q.symbol === s.symbol);
                    if (newQuote && newQuote.price !== s.quote?.price) {
                        return { ...s, quote: newQuote };
                    }
                    return s;
                }));
            } catch (error) {
                console.error("Failed to update quotes", error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleSearch = async (symbol: string) => {
        if (!symbol.trim()) return;
        const upperSymbol = symbol.toUpperCase().trim();

        // Always update history (moves to top and ensures state is fresh)
        try {
            const newHistory = await addToSearchHistory(upperSymbol);
            setHistory(newHistory);
        } catch (err) {
            console.error("Failed to update history", err);
        }

        // If not in dashboard, fetch and add it
        if (!stocks.some(s => s.symbol === upperSymbol)) {
            setLoading(true);
            setError(null);

            try {
                const data = await fetchStockData(upperSymbol);
                if (!data.quote) {
                    setError(`Could not find stock: ${upperSymbol}`);
                } else {
                    const normalizedSymbol = data.quote.symbol;
                    // Check again with normalized symbol in case it was already there under a different name
                    if (stocks.some(s => s.symbol === normalizedSymbol)) {
                        setError(`${normalizedSymbol} is already in your watchlist`);
                    } else {
                        setStocks(prev => [...prev, { symbol: normalizedSymbol, ...data }]);
                    }
                }
            } catch (err) {
                setError("Failed to fetch stock data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        setSearchInput(""); // Clear input on success or existing selection
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Market Overview</h1>
                        <p className="text-muted-foreground">Real-time evolution of key assets</p>
                    </div>
                </div>

                <div className="w-full md:w-auto">
                    <SearchHistoryInput
                        onSearch={handleSearch}
                        loading={loading}
                        history={history}
                        searchValue={searchInput}
                        onSearchValueChange={setSearchInput}
                    />
                </div>
            </header>

            {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight px-1">Main Stocks</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stocks.map(({ symbol, quote }) => (
                        quote ? (
                            <StockCard key={symbol} stock={quote} />
                        ) : (
                            <div key={symbol} className="p-4 border rounded shadow bg-card text-card-foreground">
                                Failed to load {symbol}
                            </div>
                        )
                    ))}
                </div>
            </div>

            <WorldIndices />

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                <Link
                    href="/advanced"
                    className="group inline-flex items-center gap-2 px-6 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 rounded-xl font-semibold transition-all duration-300 border border-blue-600/20 hover:border-blue-600/40 shadow-sm hover:shadow-md"
                >
                    <LineChart className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    Open Advanced Pro Chart
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                    href="/heatmap"
                    className="group inline-flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-semibold transition-all duration-300 border border-primary/20 hover:border-primary/40 shadow-sm hover:shadow-md"
                >
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    View Real-time Market Heatmap
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <MarketOverviewCards />

            <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">Historical Evolution</h2>
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                    {stocks.map(({ symbol, history }) => (
                        <StockChart
                            key={`${symbol}-chart`}
                            symbol={symbol}
                            data={history}
                            color={
                                symbol === 'NVDA' ? '#76b900' :
                                    symbol === 'SGHC' ? '#00A3E0' :
                                        undefined
                            }
                            domain={symbol === 'EUR=X' ? [0.6, 1] : undefined}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
