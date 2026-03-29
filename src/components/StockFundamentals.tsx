"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StockData } from "@/lib/stock-api"
import { DollarSign, TrendingUp, TrendingDown, PieChart, Activity } from "lucide-react"

interface StockFundamentalsProps {
    quote: StockData
}

export function StockFundamentals({ quote }: StockFundamentalsProps) {
    const formatNumber = (num: number | undefined) => {
        if (num === undefined || num === null) return "N/A"
        if (num >= 1e12) return (num / 1e12).toFixed(2) + "T"
        if (num >= 1e9) return (num / 1e9).toFixed(2) + "B"
        if (num >= 1e6) return (num / 1e6).toFixed(2) + "M"
        return num.toLocaleString()
    }

    const formatCurrency = (num: number | undefined) => {
        if (num === undefined || num === null) return "N/A"
        const decimals = quote.symbol === 'EUR=X' ? 4 : 2;
        return "$" + num.toFixed(decimals)
    }

    const formatPercent = (num: number | undefined) => {
        if (num === undefined || num === null) return "N/A"
        return (num * 100).toFixed(2) + "%"
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Key Statistics</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Market Cap
                        </span>
                        <div className="text-2xl font-bold">{formatNumber(quote.marketCap)}</div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Activity className="h-4 w-4" /> P/E Ratio
                        </span>
                        <div className="text-2xl font-bold">{quote.trailingPE?.toFixed(2) ?? "N/A"}</div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <PieChart className="h-4 w-4" /> Div Yield
                        </span>
                        <div className="text-2xl font-bold">{formatPercent(quote.dividendYield)}</div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> 52W High
                        </span>
                        <div className="text-2xl font-bold">{formatCurrency(quote.fiftyTwoWeekHigh)}</div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" /> 52W Low
                        </span>
                        <div className="text-2xl font-bold">{formatCurrency(quote.fiftyTwoWeekLow)}</div>
                    </div>
                </div>

                {quote.consensus && (
                    <div className="mt-8 pt-6 border-t pb-8 border-b grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8">
                        {/* Analyst Consensus List */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold">Analyst Consensus</h3>
                            {(() => {
                                const c = quote.consensus;
                                if (!c) return null;
                                const bullish = (c.buy || 0) + (c.strongBuy || 0);
                                const neutral = c.hold || 0;
                                const bearish = (c.sell || 0) + (c.strongSell || 0);
                                const total = bullish + neutral + bearish;
                                const totalSafe = total || 1;

                                let buyText = c.recommendationKey && c.recommendationKey !== 'none'
                                    ? c.recommendationKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                                    : '';

                                if (!buyText) {
                                    if (total === 0) {
                                        buyText = 'N/A';
                                    } else {
                                        const score = ((c.strongBuy || 0) * 1 + (c.buy || 0) * 2 + (c.hold || 0) * 3 + (c.sell || 0) * 4 + (c.strongSell || 0) * 5) / total;
                                        if (score <= 1.5) buyText = 'Strong Buy';
                                        else if (score <= 2.5) buyText = 'Buy';
                                        else if (score <= 3.5) buyText = 'Hold';
                                        else if (score <= 4.5) buyText = 'Sell';
                                        else buyText = 'Strong Sell';
                                    }
                                }

                                return (
                                    <div className="grid grid-cols-4 gap-4 text-center mt-4">
                                        <div className="flex flex-col items-center justify-start space-y-1">
                                            <span className="text-xs text-muted-foreground font-semibold tracking-wider mb-2">CONSENSUS</span>
                                            <span className={`text-base font-bold ${bullish > bearish ? 'text-green-500 dark:text-green-400' : bearish > bullish ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'}`}>
                                                {buyText}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center justify-start space-y-1">
                                            <span className="text-xs text-muted-foreground font-semibold tracking-wider mb-2">BULLISH</span>
                                            <span className="text-xl font-bold text-green-500 dark:text-green-400">{bullish}</span>
                                            <span className="text-sm text-muted-foreground">{((bullish / totalSafe) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-start space-y-1">
                                            <span className="text-xs text-muted-foreground font-semibold tracking-wider mb-2">NEUTRAL</span>
                                            <span className="text-xl font-bold text-muted-foreground">{neutral}</span>
                                            <span className="text-sm text-muted-foreground">{((neutral / totalSafe) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-start space-y-1">
                                            <span className="text-xs text-muted-foreground font-semibold tracking-wider mb-2">BEARISH</span>
                                            <span className="text-xl font-bold text-red-500 dark:text-red-400">{bearish}</span>
                                            <span className="text-sm text-muted-foreground">{((bearish / totalSafe) * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>

                        {/* 52W Price Targets Slider */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold">52W Analyst Price Targets</h3>
                            {(() => {
                                const min = quote.targetLow || 0;
                                const max = quote.targetHigh || 0;
                                const avg = quote.targetMean || 0;
                                const current = quote.price || 0;

                                // Expand boundaries to fit all values, with a 5% margin to avoid text overflow
                                const absMin = Math.min(min, current) * 0.95;
                                const absMax = Math.max(max, current) * 1.05;
                                const range = absMax - absMin || 1;

                                const getPercent = (val: number) => Math.max(0, Math.min(100, ((val - absMin) / range) * 100));

                                const minPercent = getPercent(min);
                                const maxPercent = getPercent(max);
                                const avgPercent = getPercent(avg);
                                const currentPercent = getPercent(current);

                                return (
                                    <div className="space-y-6 pt-4">
                                        <div className="relative h-10 w-full mb-2">
                                            <div
                                                className="absolute -translate-x-1/2 text-center text-sm font-medium text-muted-foreground whitespace-nowrap"
                                                style={{ left: `${minPercent}%`, bottom: '0' }}
                                            >
                                                Min Target <br /><span className="text-foreground">{formatCurrency(min)}</span>
                                            </div>
                                            <div
                                                className="absolute -translate-x-1/2 text-center text-sm font-medium text-muted-foreground whitespace-nowrap"
                                                style={{ left: `${maxPercent}%`, bottom: '0' }}
                                            >
                                                Max Target <br /><span className="text-foreground">{formatCurrency(max)}</span>
                                            </div>
                                        </div>

                                        <div className="relative h-2 bg-muted rounded-full w-full">
                                            {/* Highlight the range between min and max target */}
                                            <div className="absolute top-0 bottom-0 bg-primary/10 dark:bg-primary/20 rounded-full" style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }} />

                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-[3px] border-foreground bg-background shadow-sm z-10"
                                                style={{ left: `${currentPercent}%` }}
                                            />
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-[3px] border-green-500 dark:border-green-400 bg-background shadow-sm z-10"
                                                style={{ left: `${avgPercent}%` }}
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium pt-3">
                                            <div className="flex items-center gap-2 text-foreground">
                                                <div className="w-2.5 h-2.5 rounded-full border-[2px] border-foreground bg-background" />
                                                <span className="text-muted-foreground">Current</span><span>{formatCurrency(current)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                                <div className="w-2.5 h-2.5 rounded-full border-[2px] border-green-500 dark:border-green-400 bg-background" />
                                                <span className="text-muted-foreground">Avg Target</span><span>{formatCurrency(avg)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    </div>
                )}

                {quote.recommendations && quote.recommendations.length > 0 && (
                    <div className="mt-4 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-lg font-semibold">Analyst Recommendations</h3>
                            {quote.targetPrice && (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm text-muted-foreground font-medium">Precio Objetivo:</span>
                                    <span className="text-xl font-bold text-primary">{formatCurrency(quote.targetPrice)}</span>
                                    {(quote.targetLow || quote.targetHigh) && (
                                        <span className="text-xs text-muted-foreground">
                                            ({formatCurrency(quote.targetLow)} - {formatCurrency(quote.targetHigh)})
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="rounded-md border overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                            <table className="w-full text-sm min-w-[700px]">
                                <thead className="bg-muted/50">
                                    <tr className="text-left">
                                        <th className="p-3 font-medium">Firm</th>
                                        <th className="p-3 font-medium">Rating</th>
                                        <th className="p-3 font-medium">Target Price</th>
                                        <th className="p-3 font-medium">Upside Potential</th>
                                        <th className="p-3 font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {quote.recommendations.slice(0, 10).map((rec, i) => {
                                        const hasTarget = rec.targetPrice != null;
                                        const hasPrice = quote.price != null && quote.price > 0;
                                        const upsideValue = hasTarget && hasPrice ? ((rec.targetPrice! - quote.price) / quote.price) * 100 : null;
                                        const isPositive = upsideValue != null && upsideValue > 0;

                                        return (
                                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3 font-medium">{rec.firm}</td>
                                                <td className="p-3">
                                                    {rec.toGrade ? (
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${['buy', 'strong buy', 'outperform', 'overweight'].includes(rec.toGrade.toLowerCase()) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            ['sell', 'strong sell', 'underperform', 'underweight'].includes(rec.toGrade.toLowerCase()) ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                            }`}>
                                                            {rec.toGrade}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-3 font-medium">{hasTarget ? formatCurrency(rec.targetPrice) : '-'}</td>
                                                <td className={`p-3 font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : upsideValue != null && upsideValue < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                                                    {upsideValue != null ? `${upsideValue > 0 ? '+' : ''}${upsideValue.toFixed(2)}%` : '-'}
                                                </td>
                                                <td className="p-3 text-muted-foreground">
                                                    {new Date(rec.epochGradeDate).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
