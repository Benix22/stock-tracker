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
        return "$" + num.toFixed(2)
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
            </CardContent>
        </Card>
    )
}
