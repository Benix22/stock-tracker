"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StockData } from "@/lib/stock-api"
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"

interface MarketMoversProps {
    movers: StockData[]
    title?: string
    type?: 'gainers' | 'losers'
}

export function MarketMovers({ movers, title = "Top Gainers (US)", type = 'gainers' }: MarketMoversProps) {
    if (!movers || movers.length === 0) return null;

    const isGainers = type === 'gainers';
    const HeaderIcon = isGainers ? TrendingUp : TrendingDown;
    const ArrowIcon = isGainers ? ArrowUp : ArrowDown;
    const colorClass = isGainers ? "text-green-500" : "text-red-500";

    return (
        <Card>
            <CardHeader className="flex flex-row items-center space-x-2">
                <HeaderIcon className={`h-5 w-5 ${colorClass}`} />
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-4">
                    {movers.map((stock) => (
                        <Link href={`/stock/${stock.symbol}`} key={stock.symbol}>
                            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-lg group-hover:text-primary transition-colors">{stock.symbol}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{stock.name}</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="font-mono font-medium">${stock.price.toFixed(2)}</div>
                                        <div className={`text-xs font-medium ${colorClass} flex items-center`}>
                                            <ArrowIcon className="h-3 w-3 mr-1" />
                                            {isGainers ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
