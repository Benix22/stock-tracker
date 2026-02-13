"use client"

import { useState, useEffect } from "react";
import { StockData, HistoricalDataPoint } from "@/lib/stock-api";
import { StockCard } from "@/components/StockCard";
import { StockChart } from "@/components/StockChart";
import { fetchStockData, getBatchStockQuotes } from "@/actions/stock";
import { SearchHistoryInput } from "@/components/SearchHistoryInput";
import { getSearchHistory, addToSearchHistory } from "@/actions/history";

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

    useEffect(() => {
        getSearchHistory().then(setHistory);
    }, []);

    // Real-time updates
    const symbolsString = stocks.map(s => s.symbol).join(',');
    useEffect(() => {
        const interval = setInterval(async () => {
            const currentSymbols = symbolsString.split(',').filter(Boolean);
            if (currentSymbols.length === 0) return;

            try {
                const updatedQuotes = await getBatchStockQuotes(currentSymbols);
                setStocks(prevStocks => prevStocks.map(s => {
                    const newQuote = updatedQuotes.find(q => q.symbol === s.symbol);
                    return newQuote ? { ...s, quote: newQuote } : s;
                }));
            } catch (error) {
                console.error("Failed to update quotes", error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [symbolsString]);

    const handleSearch = async (symbol: string) => {
        if (!symbol.trim()) return;
        const upperSymbol = symbol.toUpperCase().trim();

        // Check if already exists
        if (stocks.some(s => s.symbol === upperSymbol)) {
            setError("Stock already in dashboard");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await fetchStockData(upperSymbol);
            if (!data.quote) {
                setError(`Could not find stock: ${upperSymbol}`);
            } else {
                setStocks(prev => [...prev, { symbol: upperSymbol, ...data }]);
                const newHistory = await addToSearchHistory(upperSymbol);
                setHistory(newHistory);
            }
        } catch (err) {
            setError("Failed to fetch stock data");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Stock Tracker</h1>
                    <p className="text-muted-foreground">Real-time evolution of key assets</p>
                </div>

                <div className="w-full md:w-auto">
                    <SearchHistoryInput
                        onSearch={handleSearch}
                        loading={loading}
                        history={history}
                    />
                </div>
            </header>

            {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm font-medium">
                    {error}
                </div>
            )}

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
