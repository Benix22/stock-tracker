"use client"

import { useEffect, useState } from "react";
import { RealTimeChart } from "@/components/RealTimeChart";
import { StockPerformanceTable } from "@/components/StockPerformance";
import { getIntradayData, getStockHistoryWithRange } from "@/actions/stock";
import { IntradayResult, StockPerformance, HistoricalDataPoint } from "@/lib/stock-api";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useWatchlist } from "@/hooks/use-watchlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Settings2, X, Plus } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface StockDetailClientProps {
    symbol: string;
    initialPerformance: StockPerformance | null;
}

export function StockDetailClient({ symbol, initialPerformance }: StockDetailClientProps) {
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

    const handleDataUpdate = (price: number) => {
        setLatestPrice(price);
    };

    const handleDateRangeUpdate = async (start: string | null, end: string | null) => {
        setCurrentRange({ start, end });
        if (start && end) {
            try {
                // Fetch data for main symbol
                const mainDataPromise = getStockHistoryWithRange(symbol, start, end);
                // Fetch data for comparison symbol if active
                const compDataPromise = comparedSymbol ? getStockHistoryWithRange(comparedSymbol, start, end) : Promise.resolve(null);

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
                const mainData = await getStockHistoryWithRange(symbol, start, end);
                setHistoricalData(mainData);

                // Update range state implicitly (or let user know mode changed? DateRangePicker won't reflect this unless controlled)
                // For now, simple fetch.
            }

            const data = await getStockHistoryWithRange(sym, start!, end!);
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

    return (
        <div className="grid gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold tracking-tight">Market Overview</h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => isWatched(symbol) ? removeFromWatchlist(symbol) : addToWatchlist(symbol)}
                    >
                        <Star className={`h-4 w-4 mr-2 ${isWatched(symbol) ? "fill-yellow-400 text-yellow-400" : ""}`} />
                        {isWatched(symbol) ? "Unwatch" : "Watch"}
                    </Button>
                </div>
                <div className="flex flex-wrap items-center gap-6">
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
                    <DateRangePicker onUpdate={handleDateRangeUpdate} />
                </div>
            </div>

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
            />
            {initialPerformance && (
                <StockPerformanceTable
                    performance={initialPerformance}
                    livePrice={latestPrice}
                    symbol={symbol}
                />
            )}
        </div>
    );
}
