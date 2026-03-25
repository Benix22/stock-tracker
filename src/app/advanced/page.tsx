"use client"

import { useState, useEffect } from "react";
import { AdvancedStockChart } from "@/components/AdvancedStockChart";
import { SearchHistoryInput } from "@/components/SearchHistoryInput";
import { getSearchHistory, addToSearchHistory } from "@/actions/history";
import Link from "next/link";
import { ArrowLeft, LineChart, Shield, Zap } from "lucide-react";

export default function AdvancedPage() {
    const [symbol, setSymbol] = useState("NVDA");
    const [history, setHistory] = useState<string[]>([]);
    const [searchInput, setSearchInput] = useState("");

    useEffect(() => {
        getSearchHistory().then(setHistory);
    }, []);

    const handleSearch = async (s: string) => {
        const upper = s.toUpperCase().trim();
        if (upper) {
            setSymbol(upper);
            const newHistory = await addToSearchHistory(upper);
            setHistory(newHistory);
        }
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row items-end justify-between gap-8 pb-8 border-b">
                    <div className="space-y-4">
                        <h1 className="text-5xl font-bold tracking-tight">
                            Market <span className="text-primary">Intelligence</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-xl font-medium leading-relaxed">
                            Professional-grade candlestick analysis and volume tracking for global equity markets.
                        </p>
                    </div>

                    <div className="w-full md:w-[400px]">
                        <SearchHistoryInput
                            onSearch={handleSearch}
                            history={history}
                            searchValue={searchInput}
                            onSearchValueChange={setSearchInput}
                        />
                    </div>
                </header>

                <main className="grid gap-8">
                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-1">
                        <AdvancedStockChart symbol={symbol} />
                    </div>
                </main>
                
                <footer className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3 p-6 rounded-xl border bg-card shadow-sm">
                        <h3 className="font-bold uppercase text-xs tracking-widest text-primary">Precision OHLC</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">Our advanced visor tracks every movement with standard Open, High, Low, and Close metrics for institutional-grade accuracy.</p>
                    </div>
                    <div className="space-y-3 p-6 rounded-xl border bg-card shadow-sm">
                        <h3 className="font-bold uppercase text-xs tracking-widest text-primary">Volume Weighted</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">Integrated histogram analysis allows you to spot accumulation and distribution phases with color-coded high-fidelity bars.</p>
                    </div>
                    <div className="space-y-3 p-6 rounded-xl border bg-card shadow-sm">
                        <h3 className="font-bold uppercase text-xs tracking-widest text-primary">Interactivity</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">Pinch to zoom, drag to scroll, and hover for detailed data points. Optimized for both desktop precision and touch fluidity.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
