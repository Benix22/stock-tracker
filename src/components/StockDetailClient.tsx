"use client"

import { useEffect, useState } from "react";
import { RealTimeChart } from "@/components/RealTimeChart";
import { StockPerformanceTable } from "@/components/StockPerformance";
import { getIntradayData, getStockHistoryWithRange } from "@/actions/stock";
import { IntradayResult, StockPerformance, HistoricalDataPoint, StockProfile as StockProfileType } from "@/lib/stock-api";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useWatchlist } from "@/hooks/use-watchlist";
import { StockProfile } from "@/components/StockProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Settings2, X, Plus } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { LeagueTradeWidget } from "@/components/LeagueTradeWidget";

interface StockDetailClientProps {
    symbol: string;
    initialPerformance: StockPerformance | null;
    profile: StockProfileType | null;
    isIndex?: boolean;
}

export function StockDetailClient({ symbol, initialPerformance, profile, isIndex = false }: StockDetailClientProps) {
    const { isWatched, addToWatchlist, removeFromWatchlist } = useWatchlist();
    const [latestPrice, setLatestPrice] = useState<number | null>(
        initialPerformance?.currentPrice || null
    );
    const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[] | null>(null);
    const [showSMA5, setShowSMA5] = useState(false);
    const [showSMA10, setShowSMA10] = useState(false);
    const [showSMA20, setShowSMA20] = useState(false);
    const [showRSI, setShowRSI] = useState(false);
    const [showBollinger, setShowBollinger] = useState(false);

    // Comparison State
    const [compareInput, setCompareInput] = useState("");
    const [comparedSymbol, setComparedSymbol] = useState<string | null>(null);
    const [comparisonData, setComparisonData] = useState<HistoricalDataPoint[] | null>(null);
    const [currentRange, setCurrentRange] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });
    const [activeRangeBadge, setActiveRangeBadge] = useState<string>("1D");

    const handleDataUpdate = (price: number) => {
        setLatestPrice(price);
    };

    const handleDateRangeUpdate = async (start: string | null, end: string | null) => {
        setCurrentRange({ start, end });
        if (!start || !end) {
            setActiveRangeBadge("1D");
        } else {
            setActiveRangeBadge("Custom");
        }

        if (start && end) {
            try {
                const interval = activeRangeBadge === '5D' ? '1h' : '1d';
                // Fetch data for main symbol
                const mainDataPromise = getStockHistoryWithRange(symbol, start, end, interval);
                // Fetch data for comparison symbol if active
                const compDataPromise = comparedSymbol ? getStockHistoryWithRange(comparedSymbol, start, end, interval) : Promise.resolve(null);

                const [mainData, compData] = await Promise.all([mainDataPromise, compDataPromise]);

                setHistoricalData(mainData);
                if (compData) setComparisonData(compData);
            } catch (error) {
                console.error("Failed to fetch historical data", error);
            }
        } else {
            // If clearing range, and comparison is active, we might want to default to 1Y or clear comparison
            // For now, let's clear both to revert to default view (Intraday)
            // But comparison on Intraday is tricky without more logic.
            // Let's just clear both.
            setHistoricalData(null);
            setComparisonData(null);
            setComparedSymbol(null); // Clear comparison when resetting to Intraday for simplicity
        }
    };

    const handleAddComparison = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!compareInput) return;
        const sym = compareInput.toUpperCase();

        try {
            const interval = activeRangeBadge === '5D' ? '1h' : '1d';
            // If no range selected, force a default range (e.g., YTD or 1Y)
            let start = currentRange.start;
            let end = currentRange.end;

            if (!start || !end) {
                const today = new Date();
                const past = new Date();
                past.setFullYear(today.getFullYear() - 1);
                start = past.toISOString().split('T')[0];
                end = today.toISOString().split('T')[0];

                // We need to fetch main data for this new range too, as we are switching mode
                const mainData = await getStockHistoryWithRange(symbol, start, end, interval);
                setHistoricalData(mainData);

                // Update range state implicitly (or let user know mode changed? DateRangePicker won't reflect this unless controlled)
                // For now, simple fetch.
            }

            const data = await getStockHistoryWithRange(sym, start!, end!, interval);
            setComparisonData(data);
            setComparedSymbol(sym);
            setCompareInput("");
        } catch (error) {
            console.error("Failed to fetch comparison", error);
        }
    };

    const handleRemoveComparison = () => {
        setComparedSymbol(null);
        setComparisonData(null);
        // If we were in forced-history mode, maybe leave it as is?
    };

    const handleQuickRange = (range: string) => {
        setActiveRangeBadge(range);
        if (range === '1D') {
            setCurrentRange({ start: null, end: null });
            setHistoricalData(null);
            setComparisonData(null);
            setComparedSymbol(null); // Clear comparison for 1D for simplicity
            return;
        }

        const today = new Date();
        const end = today.toISOString().split('T')[0];
        const startD = new Date();

        switch (range) {
            case '5D': startD.setDate(startD.getDate() - 5); break;
            case '1M': startD.setMonth(startD.getMonth() - 1); break;
            case '5M': startD.setMonth(startD.getMonth() - 5); break;
            case 'YTD':
                startD.setMonth(0);
                startD.setDate(1);
                break;
            case '1Y': startD.setFullYear(startD.getFullYear() - 1); break;
            case '5Y': startD.setFullYear(startD.getFullYear() - 5); break;
            case 'MAX': startD.setFullYear(startD.getFullYear() - 50); break; // roughly 50 years max
        }

        const start = startD.toISOString().split('T')[0];

        // Use an IIFE or handle locally to perform fetch
        const fetchRange = async () => {
            setCurrentRange({ start, end });
            try {
                const interval = range === '5D' ? '1h' : '1d';
                const mainDataPromise = getStockHistoryWithRange(symbol, start, end, interval);
                const compDataPromise = comparedSymbol ? getStockHistoryWithRange(comparedSymbol, start, end, interval) : Promise.resolve(null);
                const [mainData, compData] = await Promise.all([mainDataPromise, compDataPromise]);
                setHistoricalData(mainData);
                if (compData) setComparisonData(compData);
            } catch (error) {
                console.error("Failed to fetch quick range data", error);
            }
        };
        fetchRange();
    };

    return (
        <div className="grid gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight shrink-0">Market Overview</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => isWatched(symbol) ? removeFromWatchlist(symbol) : addToWatchlist(symbol)}
                            className="h-8 px-2 md:px-3 text-xs md:text-sm"
                        >
                            <Star className={`h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 ${isWatched(symbol) ? "fill-yellow-400 text-yellow-400" : ""}`} />
                            {isWatched(symbol) ? "Unwatch" : "Watch"}
                        </Button>
                        {!isIndex && <LeagueTradeWidget symbol={symbol} currentPrice={latestPrice || initialPerformance?.currentPrice || 0} />}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:gap-6 w-full md:w-auto">
                    {/* Comparison UI */}
                    <div className="flex items-center gap-2">
                        {comparedSymbol ? (
                            <div className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm">
                                <span className="font-medium">vs {comparedSymbol}</span>
                                <button onClick={handleRemoveComparison} className="ml-1 hover:text-destructive transition-colors">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleAddComparison} className="flex gap-2">
                                <Input
                                    placeholder="Compare..."
                                    value={compareInput}
                                    onChange={e => setCompareInput(e.target.value)}
                                    className="w-28 h-9 bg-background"
                                />
                                <Button type="submit" size="sm" variant="ghost" className="px-2 h-9">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </form>
                        )}
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Settings2 className="mr-2 h-4 w-4" />
                                Options
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56" align="end">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Moving Averages</h4>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="sma5" checked={showSMA5} onCheckedChange={(c) => setShowSMA5(!!c)} />
                                        <label htmlFor="sma5" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">SMA 5</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="sma10" checked={showSMA10} onCheckedChange={(c) => setShowSMA10(!!c)} />
                                        <label htmlFor="sma10" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">SMA 10</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="sma20" checked={showSMA20} onCheckedChange={(c) => setShowSMA20(!!c)} />
                                        <label htmlFor="sma20" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">SMA 20</label>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Indicators</h4>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="rsi" checked={showRSI} onCheckedChange={(c) => setShowRSI(!!c)} />
                                        <label htmlFor="rsi" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">RSI (14)</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="bollinger" checked={showBollinger} onCheckedChange={(c) => setShowBollinger(!!c)} />
                                        <label htmlFor="bollinger" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Bollinger Bands</label>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <DateRangePicker onUpdate={(s, e) => handleDateRangeUpdate(s, e)} />
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 w-full pt-2">
                {['1D', '5D', '1M', '5M', 'YTD', '1Y', '5Y', 'MAX'].map(r => (
                    <Button
                        key={r}
                        variant={activeRangeBadge === r ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleQuickRange(r)}
                        className={`text-[10px] md:text-xs h-7 px-2 md:px-3 flex-1 md:flex-none ${activeRangeBadge === r ? '' : 'text-muted-foreground'}`}
                    >
                        {r}
                    </Button>
                ))}
            </div>

            <div className="flex flex-col xl:flex-row gap-6 items-stretch min-h-[500px]">
                <div className="flex-1 min-w-0 flex">
                    <RealTimeChart
                        symbol={symbol}
                        onPriceUpdate={handleDataUpdate}
                        customData={historicalData}
                        showSMA5={showSMA5}
                        showSMA10={showSMA10}
                        showSMA20={showSMA20}
                        showRSI={showRSI}
                        showBollinger={showBollinger}
                        comparisonSymbol={comparedSymbol || undefined}
                        comparisonData={comparisonData || undefined}
                        isIndex={isIndex}
                    />
                </div>
                {profile && !isIndex && !symbol.includes('-USD') && !symbol.includes('-EUR') && (
                    <div className="w-full xl:w-80 2xl:w-96 shrink-0 flex">
                        <StockProfile profile={profile} />
                    </div>
                )}
            </div>
            {initialPerformance && (
                <StockPerformanceTable
                    performance={initialPerformance}
                    livePrice={latestPrice}
                    symbol={symbol}
                    isIndex={isIndex}
                />
            )}
        </div>
    );
}
