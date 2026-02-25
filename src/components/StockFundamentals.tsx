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

                {quote.recommendations && quote.recommendations.length > 0 && (
                    <div className="mt-8 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-lg font-semibold">Analyst Recommendations</h3>
                            {quote.targetPrice && (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm text-muted-foreground font-medium">Target Price:</span>
                                    <span className="text-xl font-bold text-primary">{formatCurrency(quote.targetPrice)}</span>
                                    {(quote.targetLow || quote.targetHigh) && (
                                        <span className="text-xs text-muted-foreground">
                                            ({formatCurrency(quote.targetLow)} - {formatCurrency(quote.targetHigh)})
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="rounded-md border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr className="text-left">
                                        <th className="p-3 font-medium">Firm</th>
                                        <th className="p-3 font-medium">Action</th>
                                        <th className="p-3 font-medium">From</th>
                                        <th className="p-3 font-medium">To</th>
                                        <th className="p-3 font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {quote.recommendations.slice(0, 10).map((rec, i) => (
                                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-medium">{rec.firm}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${rec.action === 'main' || rec.action === 'reit' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    rec.action === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        rec.action === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-muted text-muted-foreground'
                                                    }`}>
                                                    {rec.action === 'reit' ? 'Reiterated' :
                                                        rec.action === 'main' ? 'Maintains' :
                                                            rec.action === 'up' ? 'Upgraded' :
                                                                rec.action === 'down' ? 'Downgraded' :
                                                                    rec.action === 'init' ? 'Initiated' :
                                                                        rec.action.charAt(0).toUpperCase() + rec.action.slice(1)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-muted-foreground">{rec.fromGrade || '-'}</td>
                                            <td className="p-3 font-medium">{rec.toGrade}</td>
                                            <td className="p-3 text-muted-foreground">
                                                {new Date(rec.epochGradeDate).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
