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
        <div className="min-h-screen bg-[#0a0a0b] text-white p-8 selection:bg-primary selection:text-primary-foreground">
            <div className="max-w-7xl mx-auto space-y-12">
                <nav className="flex items-center justify-between">
                    <Link href="/" className="group inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors">
                        <div className="p-2 bg-white/5 rounded-lg mr-3 group-hover:bg-white/10 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </div>
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-widest uppercase">
                            <Shield className="w-3 h-3 text-primary" />
                            Secure Connection
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-widest uppercase">
                            <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            Fast Data Feed
                        </div>
                    </div>
                </nav>

                <header className="flex flex-col md:flex-row items-end justify-between gap-8 pb-8 border-b border-white/5">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                            <LineChart className="w-3 h-3" />
                            Advanced Terminal
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter">
                            Market <span className="text-primary italic">Intelligence</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-xl font-medium leading-relaxed">
                            Professional-grade candlestick analysis and volume tracking for global equity markets.
                        </p>
                    </div>

                    <div className="w-full md:w-[400px] group">
                        <div className="transition-all duration-300 transform group-hover:-translate-y-1">
                            <SearchHistoryInput
                                onSearch={handleSearch}
                                history={history}
                                searchValue={searchInput}
                                onSearchValueChange={setSearchInput}
                            />
                        </div>
                    </div>
                </header>

                <main className="grid gap-8">
                    <AdvancedStockChart symbol={symbol} />
                </main>
                
                <footer className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-muted-foreground">
                    <div className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        <h3 className="text-white font-bold uppercase text-xs tracking-widest">Precision OHLC</h3>
                        <p className="text-sm leading-relaxed">Our advanced visor tracks every movement with standard Open, High, Low, and Close metrics for institutional-grade accuracy.</p>
                    </div>
                    <div className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        <h3 className="text-white font-bold uppercase text-xs tracking-widest">Volume Weighted</h3>
                        <p className="text-sm leading-relaxed">Integrated histogram analysis allows you to spot accumulation and distribution phases with color-coded high-fidelity bars.</p>
                    </div>
                    <div className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        <h3 className="text-white font-bold uppercase text-xs tracking-widest">Interactivity</h3>
                        <p className="text-sm leading-relaxed">Pinch to zoom, drag to scroll, and hover for detailed data points. Optimized for both desktop precision and touch fluidity.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
