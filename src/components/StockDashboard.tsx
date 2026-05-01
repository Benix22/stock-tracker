"use client"

import { useState, useEffect, useRef } from "react";
import { StockData, HistoricalDataPoint } from "@/lib/stock-api";
import { StockCard } from "@/components/StockCard";
import { StockChart } from "@/components/StockChart";
import { checkMarketOpen } from "@/lib/market";
import { fetchStockData, getBatchStockQuotes } from "@/actions/stock";
import { SearchHistoryInput } from "@/components/SearchHistoryInput";
import { getSearchHistory, addToSearchHistory } from "@/actions/history";

import Link from "next/link";
import { ChevronRight, LineChart, Briefcase, TrendingUp } from "lucide-react";
import { OVERVIEW_SYMBOLS } from "@/lib/constants";
import { MarketOverviewCards } from "@/components/MarketOverviewCards";
import { WorldIndices } from "@/components/WorldIndices";
import { useStockSocket } from "@/hooks/useSocket";

interface StockDashboardProps {
    initialStocks: {
        symbol: string;
        quote: StockData | null;
        history: HistoricalDataPoint[];
    }[];
    initialIndices?: any[];
    initialOverviewQuotes?: any[];
}

export function StockDashboard({ initialStocks, initialIndices = [], initialOverviewQuotes = [] }: StockDashboardProps) {
    const [stocks, setStocks] = useState(initialStocks);
    const [history, setHistory] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState("");

    const [indices, setIndices] = useState(initialIndices);
    const [overviewQuotes, setOverviewQuotes] = useState(initialOverviewQuotes);
    const [isMarketOpen, setIsMarketOpen] = useState(checkMarketOpen());
    const { lastUpdate, connected } = useStockSocket();

    const [wsSymbols, setWsSymbols] = useState<Set<string>>(new Set());

    // Actualización inmediata por WebSockets
    useEffect(() => {
        if (lastUpdate) {
            setWsSymbols(prev => {
                if (prev.has(lastUpdate.symbol)) return prev;
                const next = new Set(prev);
                next.add(lastUpdate.symbol);
                return next;
            });

            // Dashboard Stocks
            setStocks(prev => prev.map(s => {
                if (s.symbol === lastUpdate.symbol) {
                    return {
                        ...s,
                        quote: s.quote ? { ...s.quote, price: lastUpdate.price, isLive: true } : null
                    };
                }
                return s;
            }));

            // Indices
            setIndices(prev => prev.map(idx => {
                if ((idx as any).symbol === lastUpdate.symbol) {
                    return { ...idx, price: lastUpdate.price, isLive: true };
                }
                return idx;
            }));

            // Market Overview
            setOverviewQuotes(prev => prev.map(q => {
                if (q.symbol === lastUpdate.symbol) {
                    return { ...q, price: lastUpdate.price, isLive: true };
                }
                return q;
            }));
        }
    }, [lastUpdate]);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsMarketOpen(checkMarketOpen());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        getSearchHistory().then(setHistory);
    }, []);

    const symbolsRef = useRef<string[]>([]);
    const updatingRef = useRef(false);
    
    useEffect(() => {
        const currentDashSymbols = stocks.map(s => s.symbol).filter(Boolean);
        const indexSymbols = indices.map(i => (i as any).symbol);
        symbolsRef.current = Array.from(new Set([...currentDashSymbols, ...indexSymbols, ...OVERVIEW_SYMBOLS]));
    }, [stocks, indices]);

    const connectedRef = useRef(connected);
    useEffect(() => { connectedRef.current = connected; }, [connected]);

    // Unified Real-time updates
    useEffect(() => {
        let mounted = true;
        const pollInterval = isMarketOpen ? 5000 : 15000;

        const interval = setInterval(async () => { 
            const allSymbols = symbolsRef.current;
            const hasUncoveredSymbols = allSymbols.some(s => !wsSymbols.has(s));

            // Si el socket está conectado Y no hay símbolos sin cobertura de WS, no hacemos polling
            if (connectedRef.current && !hasUncoveredSymbols) {
                return; 
            }

            if (updatingRef.current) return; 
            updatingRef.current = true;

            if (allSymbols.length === 0) {
                updatingRef.current = false;
                return;
            }

            try {
                console.log(`⏱️ [Dashboard] Polling de seguridad (${hasUncoveredSymbols ? 'Hay símbolos sin WS' : 'Socket OFF'}) para ${allSymbols.length} símbolos...`);
                const updatedQuotes = await getBatchStockQuotes(allSymbols);
                if (!mounted) return;
                

                // Update Dashboard Stocks
                setStocks(prevStocks => prevStocks.map(s => {
                    const newQuote = updatedQuotes.find(q => q?.symbol === s.symbol);
                    if (newQuote && newQuote.price !== s.quote?.price) {
                        return { ...s, quote: newQuote };
                    }
                    return s;
                }));

                // Update Indices
                setIndices(prevIndices => prevIndices.map(idx => {
                    const newQuote = updatedQuotes.find(q => q?.symbol === (idx as any).symbol);
                    if (newQuote && newQuote.price !== (idx as any).price) {
                        return { ...idx, ...newQuote };
                    }
                    return idx;
                }));

                // Update Overview
                setOverviewQuotes(updatedQuotes);
            } catch (error) {
                if (mounted) console.error("Failed to update quotes", error);
            } finally {
                updatingRef.current = false;
            }
        }, pollInterval);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [isMarketOpen, connected, wsSymbols]); 


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
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-bold tracking-tight">Market Overview</h1>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                connected 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                {connected ? 'VPS Live' : 'Polling'}
                            </div>
                        </div>
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

            <WorldIndices showMacro={false} initialData={indices as any} disablePolling={true} />


            <MarketOverviewCards initialQuotes={overviewQuotes} disablePolling={true} />

        </div>
    );
}
