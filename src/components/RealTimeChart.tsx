"use client"

import { useEffect, useState, useMemo, useRef } from "react";
import { checkMarketOpen } from "@/lib/market";
import { Area, ComposedChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ReferenceLine } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getIntradayData, fetchStockQuote } from "@/actions/stock";
import { Loader2, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { calculateRSI, calculateBollingerBands } from "@/lib/indicators";
import { FlashingDigits } from "@/components/FlashingDigits";
import { useStockSocket } from "@/hooks/useSocket";

interface DataPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

// Helper to generate flat gap points
function generateFlatGapPoints(start: DataPoint, end: DataPoint, steps: number): DataPoint[] {
    const startDate = new Date(start.date).getTime();
    const endDate = new Date(end.date).getTime();
    const stepTime = (endDate - startDate) / (steps + 1);

    const points: DataPoint[] = [];
    for (let i = 1; i <= steps; i++) {
        points.push({
            date: new Date(startDate + stepTime * i).toISOString(),
            open: start.close,
            high: start.close,
            low: start.close,
            close: start.close, // Constant value
        });
    }
    return points;
}

interface RealTimeChartProps {
    symbol: string;
    initialData?: DataPoint[];
    color?: string;
    onPriceUpdate?: (price: number) => void;
    customData?: DataPoint[] | null;
    showSMA5?: boolean;
    showSMA10?: boolean;
    showSMA20?: boolean;
    showRSI?: boolean;
    showBollinger?: boolean;
    comparisonSymbol?: string;
    comparisonData?: DataPoint[];
    isIndex?: boolean;
}

export function RealTimeChart({
    symbol,
    initialData = [],
    color = "#2563eb",
    onPriceUpdate,
    customData,
    showSMA5,
    showSMA10,
    showSMA20,
    showRSI,
    showBollinger,
    comparisonSymbol,
    comparisonData,
    isIndex = false
}: RealTimeChartProps) {
    const [data, setData] = useState<DataPoint[]>(initialData);
    const [previousClose, setPreviousClose] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [gapCount, setGapCount] = useState(0);
    const [isMarketOpen, setIsMarketOpen] = useState(true);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        setIsMarketOpen(checkMarketOpen());
        const interval = setInterval(() => {
            setIsMarketOpen(checkMarketOpen());
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Use customData if provided, otherwise manage internal state with polling
    const isCustom = !!customData;
    const displayData = isCustom ? customData : data;

    // Comparison Mode
    const isComparisonMode = !!comparisonSymbol && !!comparisonData && comparisonData.length > 0 && !!displayData && displayData.length > 0;

    // Calculate Indicators
    const rsiData = useMemo(() => showRSI ? calculateRSI(displayData || []) : [], [displayData, showRSI]);
    const bbData = useMemo(() => showBollinger ? calculateBollingerBands(displayData || []) : [], [displayData, showBollinger]);

    // Combine data
    const chartData = useMemo(() => {
        if (!displayData || displayData.length === 0) return [];

        const mainBase = displayData[0].close;
        const compBase = (isComparisonMode && comparisonData && comparisonData.length > 0) ? comparisonData[0].close : 1;

        // Create map for comparison data (matched by YYYY-MM-DD for simpler history matching)
        const compMap = new Map<string, number>();
        if (isComparisonMode && comparisonData) {
            comparisonData.forEach(d => {
                // Use full ISO string match if intraday, or date part if history?
                // For simplicity and robustness, let's try strict match first, or date-part match fallback.
                // Given standard API returns, simple date string match should work for daily.
                const key = d.date.includes('T') ? d.date.split('T')[0] : d.date; // Normalize to YYYY-MM-DD
                compMap.set(key, d.close);
            });
        }

        return displayData.map((point, index) => {
            const getSMA = (p: number) => {
                if (index < p - 1) return null;
                let sum = 0;
                for (let k = 0; k < p; k++) {
                    sum += displayData[index - k].close;
                }
                return sum / p;
            };

            const rsiPoint = showRSI ? rsiData.find(d => d.date === point.date) : null;
            const bbPoint = showBollinger ? bbData.find(d => d.date === point.date) : null;

            // Comparison Calculation
            let mainValue = point.close;
            let compValue = null;
            const dateKey = point.date.includes('T') ? point.date.split('T')[0] : point.date;

            let sma5Val = showSMA5 ? getSMA(5) : null;
            let sma10Val = showSMA10 ? getSMA(10) : null;
            let sma20Val = showSMA20 ? getSMA(20) : null;
            let bbUpper = bbPoint?.upper;
            let bbLower = bbPoint?.lower;

            if (isComparisonMode) {
                // Normalize everything to % change from base
                mainValue = ((point.close - mainBase) / mainBase) * 100;

                const cPrice = compMap.get(dateKey);
                if (cPrice !== undefined) {
                    compValue = ((cPrice - compBase) / compBase) * 100;
                }

                // Indicators must also be normalized to display correctly on the % scale
                if (sma5Val !== null) sma5Val = ((sma5Val - mainBase) / mainBase) * 100;
                if (sma10Val !== null) sma10Val = ((sma10Val - mainBase) / mainBase) * 100;
                if (sma20Val !== null) sma20Val = ((sma20Val - mainBase) / mainBase) * 100;
                if (bbUpper != null) bbUpper = ((bbUpper - mainBase) / mainBase) * 100;
                if (bbLower != null) bbLower = ((bbLower - mainBase) / mainBase) * 100;
            }

            return {
                ...point,
                value: mainValue,
                compValue: compValue,
                originalClose: point.close, // Keep original for tooltip
                sma5: sma5Val,
                sma10: sma10Val,
                sma20: sma20Val,
                rsi: rsiPoint?.value,
                bbUpper: bbUpper,
                bbMiddle: bbPoint?.middle, // Middle line not strictly needed for bands visual
                bbLower: bbLower
            };
        });
    }, [displayData, comparisonData, isComparisonMode, showSMA5, showSMA10, showSMA20, showRSI, showBollinger, rsiData, bbData]);

    const { lastUpdate, connected } = useStockSocket();

    const [hasReceivedWS, setHasReceivedWS] = useState(false);

    // Actualización instantánea por WebSocket
    useEffect(() => {
        if (lastUpdate && lastUpdate.symbol === symbol) {
            setHasReceivedWS(true);
            setData(prev => {
                if (prev.length === 0) return prev;
                const newData = [...prev];
                const lastIndex = newData.length - 1;
                newData[lastIndex] = {
                    ...newData[lastIndex],
                    close: lastUpdate.price,
                    high: Math.max(newData[lastIndex].high, lastUpdate.price),
                    low: Math.min(newData[lastIndex].low, lastUpdate.price),
                };
                return newData;
            });
            setIsLive(true);
            setLastUpdated(new Date());
            if (onPriceUpdate) onPriceUpdate(lastUpdate.price);
        }
    }, [lastUpdate, symbol, onPriceUpdate]);

    const connectedRef = useRef(connected);
    useEffect(() => { connectedRef.current = connected; }, [connected]);

    useEffect(() => {
        if (isCustom) {
            setGapCount(0);
            return;
        }

        let mounted = true;
        const fetchData = async (full = false) => {
            try {
                if (full || data.length === 0) {
                    const result = await getIntradayData(symbol);
                    if (result && result.data.length > 0 && mounted) {
                        let chartData = result.data;
                        let gaps = 0;

                        // Prepend previous close with flat gap
                        if (result.previousClose && result.previousCloseDate) {
                            const prevPoint: DataPoint = {
                                date: result.previousCloseDate,
                                open: result.previousClose,
                                high: result.previousClose,
                                low: result.previousClose,
                                close: result.previousClose
                            };
                            const firstPoint = chartData[0];
                            const targetGap = 20;
                            const gapPoints = generateFlatGapPoints(prevPoint, firstPoint, targetGap);
                            if (mounted) setData([prevPoint, ...gapPoints, ...chartData]);
                            gaps = targetGap + 1;
                        } else {
                            if (mounted) setData(chartData);
                        }

                        if (mounted) {
                            setGapCount(gaps);
                            setPreviousClose(result.previousClose);
                            setIsLive(!!result.isLive);
                            setLastUpdated(new Date());

                            const latest = result.data[result.data.length - 1];
                            if (onPriceUpdate) {
                                onPriceUpdate(latest.close);
                            }
                        }
                    }
                } else if (!connectedRef.current || !hasReceivedWS) { // Polling si NO hay socket O si este símbolo no llega por socket
                    console.log(`⏱️ [Chart:${symbol}] Ejecutando polling de seguridad (Socket: ${connectedRef.current ? 'OK' : 'OFF'}, WS_Data: ${hasReceivedWS ? 'OK' : 'NO'})...`);
                    // Optimized: Only fetch the latest quote
                    const quote = await fetchStockQuote(symbol);
                    if (quote && mounted) {
                        setData(prev => {
                            if (prev.length === 0) return prev;
                            const newData = [...prev];
                            const lastIndex = newData.length - 1;
                            newData[lastIndex] = {
                                ...newData[lastIndex],
                                close: quote.price,
                                high: Math.max(newData[lastIndex].high, quote.price),
                                low: Math.min(newData[lastIndex].low, quote.price),
                            };
                            return newData;
                        });
                        setIsLive(!!quote.isLive);
                        setLastUpdated(new Date());
                        if (onPriceUpdate) onPriceUpdate(quote.price);
                    }
                }
            } catch (e) {
                if (mounted) console.error("Failed to poll data", e);
            }
        };

        // Initial fetch
        setLoading(true);
        fetchData(true).then(() => { if (mounted) setLoading(false); });

        // Heavy poll (full history) every 5 minutes
        const heavyInterval = setInterval(() => fetchData(true), 300000);
        
        // Light poll (price only) - Si el socket no está conectado O no ha enviado datos de este símbolo
        const pollInterval = isMarketOpen ? 5000 : 15000;
        const lightInterval = setInterval(() => {
            if (!connectedRef.current || !hasReceivedWS) fetchData(false);
        }, pollInterval);
        
        return () => {
            mounted = false;
            clearInterval(heavyInterval);
            clearInterval(lightInterval);
        };
    }, [symbol, initialData.length, isCustom, onPriceUpdate, isMarketOpen, hasReceivedWS]);


    if (loading && (!displayData || displayData.length === 0)) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    if (!displayData || displayData.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                        <div className="flex items-center gap-2">
                            {symbol} {isCustom ? 'History' : 'Intraday'}
                            {!isCustom && !symbol.includes('=') && !symbol.includes('^') && !symbol.includes('-') && (
                                <span 
                                    className={`flex h-2 w-2 rounded-full shrink-0 ${isMarketOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} 
                                    title={isMarketOpen ? "Market Open (Alpaca Real-time)" : "Market Closed (Last Price)"} 
                                />
                            )}
                        </div>
                </CardHeader>
                <CardContent>No data available</CardContent>
            </Card>
        );
    }

    const currentPrice = displayData[displayData.length - 1].close;

    // Domain calculation based on VISUAL values (normalized or price)
    // We filter chartData to find min/max of visible lines
    const allValues = chartData.flatMap(d => {
        const vals = [d.value];
        if (d.compValue !== null && d.compValue !== undefined) vals.push(d.compValue);
        return vals;
    });

    // Fallback if empty
    const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
    const maxVal = allValues.length > 0 ? Math.max(...allValues) : 100;

    // Add padding
    const domainPadding = (maxVal - minVal) * 0.05; // 5% padding
    const domainMin = minVal - domainPadding;
    const domainMax = maxVal + domainPadding;

    // If not comparison, standard price polish (e.g. 0.999 logic) can be applied, but this generic logic works too.

    const decimals = symbol === 'EUR=X' ? 4 : 2;
    const gapPercentage = (gapCount / (displayData.length || 1)) * 100;
    const strokeGradientId = `stroke-gradient-${symbol}`;
    const fillGradientId = `fill-gradient-${symbol}`;

    // Calculate change (Logic for header display)
    let changePercent = 0;
    let changeValue = 0;
    let referencePrice = 0;
    let referenceLabel = "";

    if (!isCustom && previousClose) {
        changeValue = currentPrice - previousClose;
        changePercent = (changeValue / previousClose) * 100;
        referencePrice = previousClose;
        referenceLabel = isIndex ? `vs Prev Close (${referencePrice.toFixed(decimals)})` : `vs Prev Close ($${referencePrice.toFixed(decimals)})`;
    } else if (isCustom && displayData && displayData.length > 0) {
        const firstPrice = displayData[0].close;
        changeValue = currentPrice - firstPrice;
        changePercent = (changeValue / firstPrice) * 100;
        referencePrice = firstPrice;
        referenceLabel = isIndex ? `in this period (Start: ${referencePrice.toFixed(decimals)})` : `in this period (Start: $${referencePrice.toFixed(decimals)})`;
    }

    return (
        <Card className="w-full h-full flex flex-col shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 space-y-4 sm:space-y-0">
                <div className="space-y-1 w-full">
                    <CardTitle className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                            <span className="text-base md:text-lg">{symbol} {isCustom ? 'History' : `Today (${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}</span>
                            {!isCustom && !symbol.includes('=') && !symbol.includes('^') && !symbol.includes('-') && (
                                <span 
                                    className={`flex h-2 w-2 rounded-full shrink-0 ${isMarketOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} 
                                    title={isMarketOpen ? "Market Open (Alpaca Real-time)" : "Market Closed (Last Price)"} 
                                />
                            )}
                        </div>
                        {isComparisonMode && (
                            <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm font-normal">
                                <span style={{ color: color }}>● {symbol}</span>
                                <span style={{ color: "#d946ef" }}>● {comparisonSymbol}</span>
                            </div>
                        )}
                    </CardTitle>
                    {(changeValue !== 0 || changePercent !== 0) ? (
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <div className="flex items-center text-sm md:text-base font-medium">
                                <span className={`flex items-center ${changeValue > 0 ? "text-green-500" : changeValue < 0 ? "text-red-500" : ""}`}>
                                    {changeValue > 0 ? "+" : ""}{changeValue.toFixed(decimals)}{!isIndex && " US$"}
                                    <span className="flex items-center ml-1">
                                        (
                                        {changeValue > 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : changeValue < 0 ? <ArrowDownIcon className="h-3 w-3 mr-1" /> : null}
                                        {changePercent.toFixed(2)}%)
                                    </span>
                                </span>
                                <span className="text-muted-foreground ml-2 text-[10px] md:text-xs">{referenceLabel}</span>
                            </div>

                            <div className={`text-2xl md:text-4xl font-bold flex items-center gap-3 ${changeValue > 0 ? "text-green-500" : changeValue < 0 ? "text-red-500" : "text-foreground"
                                }`}>
                                <FlashingDigits value={currentPrice} decimals={decimals} prefix={isIndex ? "" : "$"} />
                                {isLive && isMarketOpen && (
                                    <span className="bg-blue-500/10 text-blue-500 text-xs px-2 py-1 rounded border border-blue-500/20 font-bold animate-pulse">
                                        VPS LIVE
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className="text-2xl md:text-4xl font-bold text-foreground">
                                <FlashingDigits value={currentPrice} decimals={decimals} prefix={isIndex ? "" : "$"} />
                            </span>
                            {isLive && isMarketOpen && (
                                <span className="bg-blue-500/10 text-blue-500 text-xs px-2 py-1 rounded border border-blue-500/20 font-bold animate-pulse">
                                    VPS LIVE
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pl-0 flex-1 flex flex-col min-h-0">
                <div className="flex-1 w-full flex flex-col min-h-0">
                    <div className="flex-1 min-h-[300px] md:min-h-[400px]">
                        <ResponsiveContainer width="100%" height={showRSI ? "75%" : "100%"}>
                            <ComposedChart data={chartData} syncId="stockChart">
                                <defs>
                                    <linearGradient id={strokeGradientId} x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#9ca3af" />
                                        <stop offset={`${Math.max(0, gapPercentage - 1)}%`} stopColor="#9ca3af" />
                                        <stop offset={`${gapPercentage}%`} stopColor={color} />
                                        <stop offset="100%" stopColor={color} />
                                    </linearGradient>
                                    <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    hide={!isCustom || showRSI}
                                    tickFormatter={(val) => {
                                        if (isCustom) return new Date(val).toLocaleDateString();
                                        return val;
                                    }}
                                    minTickGap={30}
                                />
                                <YAxis
                                    yAxisId="price"
                                    domain={[domainMin, domainMax]}
                                    tickFormatter={(val) => isComparisonMode ? `${val.toFixed(2)}%` : val.toFixed(decimals)}
                                    orientation="right"
                                    stroke="#888"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    yAxisId="volume"
                                    orientation="left"
                                    hide
                                    domain={[0, 'dataMax * 4']}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                    labelFormatter={(value) => {
                                        const date = new Date(value);
                                        if (isCustom && !value.includes('T')) {
                                            return date.toLocaleDateString();
                                        }
                                        return date.toLocaleString();
                                    }}
                                    formatter={(value: any, name: any, payload: any) => {
                                        // payload is complex, but rechart passes payload inside item usually
                                        // But here 'value' is the raw value passed to the line
                                        if (name === "Volume") return [value.toLocaleString(), name];
                                        if (name === "RSI") return [Number(value).toFixed(2), name];
                                        if (name.includes("BB")) return [Number(value).toFixed(2), name];
                                        if (name.includes("SMA")) return [Number(value).toFixed(2), name];

                                        // For Price lines:
                                        if (name === "Price" || name === symbol) {
                                            if (isComparisonMode) return [`${Number(value).toFixed(2)}%`, name];
                                            return [isIndex ? Number(value).toFixed(decimals) : `$${Number(value).toFixed(decimals)}`, name];
                                        }
                                        if (name === comparisonSymbol) {
                                            return [`${Number(value).toFixed(2)}%`, name];
                                        }

                                        return [Number(value).toFixed(2), name];
                                    }}
                                />
                                {!isComparisonMode && (
                                    <Bar
                                        dataKey="volume"
                                        yAxisId="volume"
                                        fill="#94a3b8"
                                        opacity={0.8}
                                        barSize={isCustom ? 8 : 2}
                                        name="Volume"
                                    />
                                )}
                                <Area
                                    type="monotone"
                                    dataKey="value" // Use derived value (normalized or price)
                                    yAxisId="price"
                                    stroke={`url(#${strokeGradientId})`}
                                    strokeWidth={2}
                                    fillOpacity={isComparisonMode ? 0 : 1} // Transparent fill in comparison mode for clarity
                                    fill={`url(#${fillGradientId})`}
                                    isAnimationActive={false}
                                    name={symbol} // Use symbol name
                                />
                                {isComparisonMode && (
                                    <Line
                                        type="monotone"
                                        dataKey="compValue"
                                        yAxisId="price"
                                        stroke="#d946ef" // Fuchsia-500
                                        strokeWidth={2}
                                        dot={false}
                                        name={comparisonSymbol}
                                        isAnimationActive={false}
                                    />
                                )}
                                {showSMA5 && (
                                    <Area
                                        type="monotone"
                                        dataKey="sma5"
                                        yAxisId="price"
                                        stroke="#f97316"
                                        strokeWidth={2}
                                        fillOpacity={0}
                                        isAnimationActive={false}
                                        dot={false}
                                        name="SMA 5"
                                    />
                                )}
                                {showSMA10 && (
                                    <Area
                                        type="monotone"
                                        dataKey="sma10"
                                        yAxisId="price"
                                        stroke="#a855f7"
                                        strokeWidth={2}
                                        fillOpacity={0}
                                        isAnimationActive={false}
                                        dot={false}
                                        name="SMA 10"
                                    />
                                )}
                                {showSMA20 && (
                                    <Area
                                        type="monotone"
                                        dataKey="sma20"
                                        yAxisId="price"
                                        stroke="#eab308"
                                        strokeWidth={2}
                                        fillOpacity={0}
                                        isAnimationActive={false}
                                        dot={false}
                                        name="SMA 20"
                                    />
                                )}
                                {showBollinger && (
                                    <>
                                        <Line type="monotone" dataKey="bbUpper" yAxisId="price" stroke="#4b5563" dot={false} strokeWidth={2} name="BB Upper" />
                                        <Line type="monotone" dataKey="bbLower" yAxisId="price" stroke="#4b5563" dot={false} strokeWidth={2} name="BB Lower" />
                                    </>
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>

                        {showRSI && (
                            <ResponsiveContainer width="100%" height="25%">
                                <ComposedChart data={chartData} syncId="stockChart">
                                    <XAxis
                                        dataKey="date"
                                        hide={!isCustom}
                                        tickFormatter={(val) => {
                                            if (isCustom) return new Date(val).toLocaleDateString();
                                            return val;
                                        }}
                                        minTickGap={30}
                                    />
                                    <YAxis domain={[0, 100]} orientation="right" stroke="#888" tickLine={false} axisLine={false} ticks={[30, 70]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                        labelFormatter={() => ''}
                                    />
                                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                                    <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" />
                                    <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} dot={false} name="RSI" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
