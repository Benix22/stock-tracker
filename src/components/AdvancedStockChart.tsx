"use client"

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, HistogramData, Time, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Maximize2, Settings2, BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { HistoricalDataPoint } from '@/lib/stock-api';
import { getStockHistoryWithRange } from '@/actions/stock';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdvancedStockChartProps {
    symbol: string;
    initialData?: HistoricalDataPoint[];
}

export function AdvancedStockChart({ symbol, initialData = [] }: AdvancedStockChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    const [data, setData] = useState<HistoricalDataPoint[]>(initialData);
    const [loading, setLoading] = useState(initialData.length === 0);
    const [range, setRange] = useState<'1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL'>('1Y');

    // Fetch data when symbol or range changes
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const to = new Date().toISOString().split('T')[0];
                const fromDate = new Date();
                
                switch (range) {
                    case '1M': fromDate.setMonth(fromDate.getMonth() - 1); break;
                    case '3M': fromDate.setMonth(fromDate.getMonth() - 3); break;
                    case '6M': fromDate.setMonth(fromDate.getMonth() - 6); break;
                    case '1Y': fromDate.setFullYear(fromDate.getFullYear() - 1); break;
                    case '5Y': fromDate.setFullYear(fromDate.getFullYear() - 5); break;
                    case 'ALL': fromDate.setFullYear(fromDate.getFullYear() - 20); break;
                }
                
                const from = fromDate.toISOString().split('T')[0];
                const history = await getStockHistoryWithRange(symbol, from, to, '1d');
                setData(history);
            } catch (error) {
                console.error("Failed to fetch history for advanced chart", error);
            } finally {
                setLoading(false);
            }
        };

        if (symbol) {
            fetchData();
        }
    }, [symbol, range]);

    // Initialize and update chart
    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                try {
                    chartRef.current.applyOptions({ 
                        width: chartContainerRef.current.clientWidth,
                        height: chartContainerRef.current.clientHeight 
                    });
                } catch (e) {
                    // Ignore resize errors on disposed charts
                }
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#1f2937', 
            },
            grid: {
                vertLines: { color: 'rgba(197, 203, 206, 0.2)' },
                horzLines: { color: 'rgba(197, 203, 206, 0.2)' },
            },
            crosshair: {
                mode: 0,
                vertLine: {
                    width: 1,
                    color: 'rgba(37, 99, 235, 0.5)',
                    style: 1,
                    labelBackgroundColor: '#2563eb',
                },
                horzLine: {
                    width: 1,
                    color: 'rgba(37, 99, 235, 0.5)',
                    style: 1,
                    labelBackgroundColor: '#2563eb',
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.4)',
                autoScale: true,
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.4)',
                timeVisible: true,
                secondsVisible: false,
            },
            handleScroll: true,
            handleScale: true,
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
        });

        // Dark mode adjustment
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            chart.applyOptions({
                layout: { textColor: '#9ca3af' },
                grid: {
                    vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                    horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
                },
            });
        }

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#2563eb',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '', 
        });

        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        // Format data
        const candleData: CandlestickData[] = data.map(d => ({
            time: d.date as Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }));

        const volumeData: HistogramData[] = data.map(d => ({
            time: d.date as Time,
            value: d.volume || 0,
            color: d.close >= d.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
        }));

        candleSeries.setData(candleData);
        volumeSeries.setData(volumeData);

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries as any;
        volumeSeriesRef.current = volumeSeries as any;

        window.addEventListener('resize', handleResize);
        chart.timeScale().fitContent();

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
        };
    }, [data]);

    const stats = useMemo(() => {
        if (data.length === 0) return null;
        const latest = data[data.length - 1];
        const change = latest.close - latest.open;
        const percent = (change / latest.open) * 100;
        return { latest, change, percent };
    }, [data]);

    return (
        <Card className="w-full h-[700px] flex flex-col border-none shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden ring-1 ring-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                            {symbol}
                            <span className="text-xs font-medium px-2 py-0.5 bg-muted rounded-full">Pro Viewer</span>
                        </CardTitle>
                        {stats && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-3xl font-bold font-mono">
                                    ${stats.latest.close.toFixed(2)}
                                </span>
                                <span className={`flex items-center text-sm font-semibold ${stats.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)} ({stats.percent.toFixed(2)}%)
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Tabs value={range} onValueChange={(v: string) => setRange(v as any)} className="bg-muted/50 p-1 rounded-lg">
                        <TabsList className="h-8">
                            <TabsTrigger value="1M" className="text-xs px-3">1M</TabsTrigger>
                            <TabsTrigger value="3M" className="text-xs px-3">3M</TabsTrigger>
                            <TabsTrigger value="6M" className="text-xs px-3">6M</TabsTrigger>
                            <TabsTrigger value="1Y" className="text-xs px-3">1Y</TabsTrigger>
                            <TabsTrigger value="5Y" className="text-xs px-3">5Y</TabsTrigger>
                            <TabsTrigger value="ALL" className="text-xs px-3">ALL</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-10 w-10">
                            <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-10 w-10">
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 relative p-0 overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm transition-all animate-in fade-in">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-sm font-medium text-muted-foreground animate-pulse">Fetching Real-time Market Data...</p>
                    </div>
                )}
                
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-sm flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Candlesticks</span>
                    </div>
                    <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-sm flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daily Interval</span>
                    </div>
                </div>

                <div ref={chartContainerRef} className="w-full h-full" />
                
                {data.length === 0 && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        No historical data available for this range
                    </div>
                )}
            </CardContent>
            <div className="px-6 py-3 border-t bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">
                <div className="flex gap-6">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Live Feed Active
                    </span>
                    <span>Exchange: {symbol.includes('.') ? symbol.split('.')[1] || 'NYSE' : 'NASDAQ'}</span>
                </div>
                <div className="flex gap-4">
                    <span>Precision: 0.0001</span>
                    <span>Timezone: UTC</span>
                </div>
            </div>
        </Card>
    );
}
