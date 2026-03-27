"use client"

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, HistogramData, Time, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Maximize2, Settings2, BarChart3, TrendingUp, Calendar, Eye, EyeOff, Activity } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { HistoricalDataPoint } from '@/lib/stock-api';
import { getStockHistoryWithRange, getAlpacaHistoricalBars, getAlpacaConfig } from '@/actions/stock';
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
    const [range, setRange] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | '5Y'>('1M');
    
    // Live override for header stats
    const [livePrice, setLivePrice] = useState<number | null>(null);
    const [liveChange, setLiveChange] = useState<number | null>(null);
    const [livePercent, setLivePercent] = useState<number | null>(null);

    // UI Toggles for Indicators
    const [showSMA50, setShowSMA50] = useState(true);
    const [showSMA200, setShowSMA200] = useState(false);
    const [showRSI, setShowRSI] = useState(true);
    const [showMACD, setShowMACD] = useState(false);

    // Refs for Indicator Series
    const sma50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const sma200SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const macdSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const macdSignalSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const macdHistSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    // Helper to calculate Indicators
    const indicators = useMemo(() => {
        if (data.length < 50) return { sma50: [], sma200: [], rsi: [], macd: [] };

        const calculateSMA = (period: number) => {
            return data.map((_, idx) => {
                if (idx < period - 1) return null;
                const slice = data.slice(idx - period + 1, idx + 1);
                const sum = slice.reduce((acc, d) => acc + d.close, 0);
                return { time: data[idx].date, value: sum / period };
            }).filter(d => d !== null);
        };

        const calculateRSI = (period: number = 14) => {
            let gains = 0, losses = 0;
            return data.map((d, idx) => {
                if (idx === 0) return null;
                const diff = d.close - data[idx - 1].close;
                const gain = diff > 0 ? diff : 0;
                const loss = diff < 0 ? -diff : 0;

                if (idx <= period) {
                    gains += gain;
                    losses += loss;
                    if (idx < period) return null;
                } else {
                    gains = (gains * (period - 1) + gain) / period;
                    losses = (losses * (period - 1) + loss) / period;
                }

                const rs = gains / (losses || 1);
                return { time: d.date, value: 100 - (100 / (1 + rs)) };
            }).filter(d => d !== null);
        };

        const calculateMACD = () => {
            const ema = (period: number, prices: number[]) => {
                const k = 2 / (period + 1);
                const results = [prices[0]];
                for (let i = 1; i < prices.length; i++) {
                    results.push(prices[i] * k + results[i - 1] * (1 - k));
                }
                return results;
            };

            const closes = data.map(d => d.close);
            const ema12 = ema(12, closes);
            const ema26 = ema(26, closes);
            const macdLine = ema12.map((v, i) => v - ema26[i]);
            const signalLine = ema(9, macdLine);
            
            return data.map((d, i) => ({
                time: d.date,
                macd: macdLine[i],
                signal: signalLine[i],
                hist: macdLine[i] - signalLine[i]
            }));
        };

        return {
            sma50: calculateSMA(50),
            sma200: calculateSMA(200),
            rsi: calculateRSI(14),
            macd: calculateMACD()
        };
    }, [data]);

    // WebSocket Logic for Real-time Updates
    useEffect(() => {
        let ws: WebSocket | null = null;
        let authTimeout: NodeJS.Timeout;

        const connectWS = async () => {
            if (!symbol || symbol.includes('.') || symbol.includes('^')) return;

            const config = await getAlpacaConfig();
            if (!config.keyId || !config.secretKey) return;

            // CRITICAL: For free accounts, use ONLY the IEX URL
            const wsUrl = 'wss://stream.data.alpaca.markets/v2/iex';

            console.log(`[WebSocket] Connecting to Alpaca IEX for ${symbol}...`);
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('[WebSocket] Connection established. Authenticating...');
                ws?.send(JSON.stringify({
                    action: 'auth',
                    key: config.keyId,
                    secret: config.secretKey
                }));
            };

            ws.onmessage = (event) => {
                const messages = JSON.parse(event.data);
                for (const msg of messages) {
                    if (msg.T === 'success' && msg.msg === 'authenticated') {
                        console.log(`[WebSocket] Authenticated. Subscribing to trades/bars for ${symbol}`);
                        ws?.send(JSON.stringify({
                            action: 'subscribe',
                            trades: [symbol.toUpperCase()],
                            bars: [symbol.toUpperCase()]
                        }));
                    } else if (msg.T === 't' && msg.S === symbol.toUpperCase()) {
                        // Real-time TRADE received
                        console.log(`[WebSocket] TRADE: ${symbol} @ $${msg.p}`);
                        setLivePrice(msg.p);
                        
                        // Update Chart
                        if (candleSeriesRef.current) {
                            const tradeDate = new Date(msg.t);
                            tradeDate.setSeconds(0, 0); 
                            const minuteTimestamp = Math.floor(tradeDate.getTime() / 1000) as Time;

                            candleSeriesRef.current.update({
                                time: minuteTimestamp,
                                close: msg.p,
                            });
                        }
                    } else if (msg.T === 'b' && msg.S === symbol.toUpperCase()) {
                        console.log(`[WebSocket] BAR closed for ${symbol} @ $${msg.c}`);
                        // Consolidate the BAR at the end of the minute
                        if (candleSeriesRef.current && volumeSeriesRef.current) {
                            const barDate = new Date(msg.t);
                            barDate.setSeconds(0, 0); 
                            const minuteTimestamp = Math.floor(barDate.getTime() / 1000) as Time;
                            
                            candleSeriesRef.current.update({
                                time: minuteTimestamp,
                                open: msg.o,
                                high: msg.h,
                                low: msg.l,
                                close: msg.c
                            });

                            volumeSeriesRef.current.update({
                                time: minuteTimestamp,
                                value: msg.v,
                                color: msg.c >= msg.o ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'
                            });
                        }
                    } else if (msg.T === 'error') {
                        console.error('[WebSocket] Alpaca Error:', msg);
                    }
                }
            };

            ws.onerror = (error) => {
                console.error('Alpaca WebSocket Error:', error);
            };

            ws.onclose = () => {
                // Silently close
            };
        };

        connectWS();

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [symbol]);

    // Fetch data when symbol or range changes
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const to = new Date().toISOString();
                const fromDate = new Date();
                let timeframe = '1Day';
                
                switch (range) {
                    case '1D': 
                        fromDate.setDate(fromDate.getDate() - 1); 
                        timeframe = '1Min';
                        break;
                    case '1W': 
                        fromDate.setDate(fromDate.getDate() - 7); 
                        timeframe = '15Min';
                        break;
                    case '1M': 
                        fromDate.setMonth(fromDate.getMonth() - 1); 
                        timeframe = '1Hour';
                        break;
                    case '3M': 
                        fromDate.setMonth(fromDate.getMonth() - 3); 
                        timeframe = '1Day';
                        break;
                    case '1Y': 
                        fromDate.setFullYear(fromDate.getFullYear() - 1); 
                        timeframe = '1Day';
                        break;
                    case '5Y': 
                        fromDate.setFullYear(fromDate.getFullYear() - 5); 
                        timeframe = '1Week';
                        break;
                }
                
                const from = fromDate.toISOString();
                
                // Fetch from Alpaca Data API via Server Action
                const history = await getAlpacaHistoricalBars(symbol, timeframe, from, to);
                
                // Fallback to Yahoo if no data from Alpaca (e.g. invalid symbol or free tier restriction)
                if (history.length === 0) {
                    const fallbackTo = to.split('T')[0];
                    const fallbackFrom = fromDate.toISOString().split('T')[0];
                    const fallbackHistory = await getStockHistoryWithRange(symbol, fallbackFrom, fallbackTo, range === '1D' || range === '1W' ? '5m' : '1d');
                    setData(fallbackHistory);
                } else {
                    setData(history);
                }
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

        // Calculate heights for panes
        const rsiPaneTop = 0.7;
        const rsiPaneHeight = 0.15;
        const macdPaneTop = 0.85;
        const macdPaneHeight = 0.15;

        // Dark mode adjustment
        const isDark = document.documentElement.classList.contains('dark');
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        const textColor = isDark ? '#9ca3af' : '#1f2937';

        chart.applyOptions({
            layout: { textColor },
            grid: {
                vertLines: { color: gridColor },
                horzLines: { color: gridColor },
            },
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        // SMA Series
        const sma50Series = chart.addSeries(LineSeries, {
            color: '#2563eb',
            lineWidth: 2,
            title: 'SMA 50',
            visible: showSMA50,
        });

        const sma200Series = chart.addSeries(LineSeries, {
            color: '#f59e0b',
            lineWidth: 2,
            title: 'SMA 200',
            visible: showSMA200,
        });

        // Volume Series (Bottom 20% of main pane)
        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#2563eb',
            priceFormat: { type: 'volume' },
            priceScaleId: '', 
        });

        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });

        // RSI Series (Dedicated Pane)
        const rsiSeries = chart.addSeries(LineSeries, {
            color: '#8b5cf6',
            lineWidth: 2,
            priceScaleId: 'rsi',
            title: 'RSI (14)',
            visible: showRSI,
        });

        rsiSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.75, bottom: 0.1 },
            autoScale: false,
        });

        // MACD Series (Dedicated Pane)
        const macdSeries = chart.addSeries(LineSeries, {
            color: '#2563eb',
            lineWidth: 1,
            priceScaleId: 'macd',
            visible: showMACD,
        });
        const macdSignalSeries = chart.addSeries(LineSeries, {
            color: '#ef4444',
            lineWidth: 1,
            priceScaleId: 'macd',
            visible: showMACD,
        });
        const macdHistSeries = chart.addSeries(HistogramSeries, {
            priceScaleId: 'macd',
            visible: showMACD,
        });

        macdSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.85, bottom: 0.05 },
        });

        // Format data properly for lightweight-charts
        const formatTime = (dateStr: string) => {
            if (dateStr.length > 10) {
                return Math.floor(new Date(dateStr).getTime() / 1000) as Time;
            }
            return dateStr as Time;
        };

        const convertedCandleData = data.map(d => ({
            time: formatTime(d.date),
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }));

        const convertedVolumeData = data.map(d => ({
            time: formatTime(d.date),
            value: d.volume || 0,
            color: d.close >= d.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
        }));

        candleSeries.setData(convertedCandleData);
        volumeSeries.setData(convertedVolumeData);
        
        // Set Indicator Data
        sma50Series.setData(indicators.sma50.map(d => ({ time: formatTime(d.time), value: d.value })));
        sma200Series.setData(indicators.sma200.map(d => ({ time: formatTime(d.time), value: d.value })));
        rsiSeries.setData(indicators.rsi.map(d => ({ time: formatTime(d.time), value: d.value })));
        
        macdSeries.setData(indicators.macd.map(d => ({ time: formatTime(d.time), value: d.macd })));
        macdSignalSeries.setData(indicators.macd.map(d => ({ time: formatTime(d.time), value: d.signal })));
        macdHistSeries.setData(indicators.macd.map(d => ({ 
            time: formatTime(d.time), 
            value: d.hist,
            color: d.hist >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
        })));

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries as any;
        volumeSeriesRef.current = volumeSeries as any;
        sma50SeriesRef.current = sma50Series;
        sma200SeriesRef.current = sma200Series;
        rsiSeriesRef.current = rsiSeries;
        macdSeriesRef.current = macdSeries;
        macdSignalSeriesRef.current = macdSignalSeries;
        macdHistSeriesRef.current = macdHistSeries;

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
                                    ${(livePrice ?? stats.latest.close).toFixed(2)}
                                </span>
                                <span className={`flex items-center text-sm font-semibold ${(liveChange ?? stats.change) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {(liveChange ?? stats.change) >= 0 ? '+' : ''}{(liveChange ?? stats.change).toFixed(2)} ({(livePercent ?? stats.percent).toFixed(2)}%)
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Tabs value={range} onValueChange={(v: string) => setRange(v as any)} className="bg-muted/50 p-1 rounded-lg">
                        <TabsList className="h-8">
                            <TabsTrigger value="1D" className="text-xs px-3">1D</TabsTrigger>
                            <TabsTrigger value="1W" className="text-xs px-3">1W</TabsTrigger>
                            <TabsTrigger value="1M" className="text-xs px-3">1M</TabsTrigger>
                            <TabsTrigger value="3M" className="text-xs px-3">3M</TabsTrigger>
                            <TabsTrigger value="1Y" className="text-xs px-3">1Y</TabsTrigger>
                            <TabsTrigger value="5Y" className="text-xs px-3">5Y</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-10 w-10 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                                >
                                    <Activity className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-4">
                                <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Settings2 className="w-3.5 h-3.5" />
                                    Indicators
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="sma50" className="text-xs font-medium cursor-pointer">SMA 50 (Trend)</Label>
                                        <Checkbox id="sma50" checked={showSMA50} onCheckedChange={(v) => setShowSMA50(!!v)} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="sma200" className="text-xs font-medium cursor-pointer">SMA 200 (Long Term)</Label>
                                        <Checkbox id="sma200" checked={showSMA200} onCheckedChange={(v) => setShowSMA200(!!v)} />
                                    </div>
                                    <div className="flex items-center justify-between border-t pt-2">
                                        <Label htmlFor="rsi" className="text-xs font-medium cursor-pointer text-violet-500">RSI (Oversold/Bought)</Label>
                                        <Checkbox id="rsi" checked={showRSI} onCheckedChange={(v) => setShowRSI(!!v)} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="macd" className="text-xs font-medium cursor-pointer text-blue-500">MACD (Momentum)</Label>
                                        <Checkbox id="macd" checked={showMACD} onCheckedChange={(v) => setShowMACD(!!v)} />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
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
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-[ping_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
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
