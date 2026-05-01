"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { getBatchStockQuotes } from "@/actions/stock"
import { INDEX_CONSTITUENTS } from "@/lib/constants"
import { StockData } from "@/lib/stock-api"
import { FlashingDigits } from "@/components/FlashingDigits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpRight, ArrowDownRight, TrendingUp, Activity } from "lucide-react"
import Link from "next/link"

interface IndexConstituentsTableProps {
    symbol: string;
    indexName: string;
    initialData: StockData[];
}

export function IndexConstituentsTable({ symbol, indexName, initialData }: IndexConstituentsTableProps) {
    const [stocks, setStocks] = useState<StockData[]>(initialData)
    const [search, setSearch] = useState("")
    const [sortBy, setSortBy] = useState<keyof StockData>("marketCap")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

    const constituents = INDEX_CONSTITUENTS[symbol] || []
    const updatingRef = useRef(false)

    useEffect(() => {
        if (constituents.length === 0) return
        let mounted = true

        const interval = setInterval(async () => {
            if (updatingRef.current) return
            updatingRef.current = true
            
            try {
                const updated = await getBatchStockQuotes(constituents)
                if (updated && updated.length > 0 && mounted) {
                    setStocks(updated)
                }
            } catch (error) {
                if (mounted) console.error(`Failed to update ${indexName} data`, error)
            } finally {
                updatingRef.current = false
            }
        }, 5000)

        return () => {
            mounted = false
            clearInterval(interval)
        }
    }, [symbol, indexName, constituents])

    const filteredAndSortedStocks = useMemo(() => {
        return stocks
            .filter(s => 
                s.name.toLowerCase().includes(search.toLowerCase()) || 
                s.symbol.toLowerCase().includes(search.toLowerCase())
            )
            .sort((a, b) => {
                const valA = a[sortBy] ?? 0
                const valB = b[sortBy] ?? 0
                if (valA < valB) return sortOrder === "asc" ? -1 : 1
                if (valA > valB) return sortOrder === "asc" ? 1 : -1
                return 0
            })
    }, [stocks, search, sortBy, sortOrder])

    const stats = useMemo(() => {
        if (stocks.length === 0) return { up: 0, down: 0, avgChange: 0 }
        const up = stocks.filter(s => s.change > 0).length
        const down = stocks.filter(s => s.change < 0).length
        const avgChange = stocks.reduce((acc, s) => acc + s.changePercent, 0) / stocks.length
        return { up, down, avgChange }
    }, [stocks])

    const currencySymbol = symbol.startsWith('^') && !symbol.includes('GSPC') && !symbol.includes('NDX') ? "€" : symbol === '^N225' ? "¥" : "$"

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Quick Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-background/40 backdrop-blur-md border-emerald-500/20">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Advancing</p>
                            <h3 className="text-2xl font-bold text-emerald-500">{stats.up}</h3>
                        </div>
                        <TrendingUp className="h-8 w-8 text-emerald-500/20" />
                    </CardContent>
                </Card>
                <Card className="bg-background/40 backdrop-blur-md border-rose-500/20">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Declining</p>
                            <h3 className="text-2xl font-bold text-rose-500">{stats.down}</h3>
                        </div>
                        <TrendingUp className="h-8 w-8 text-rose-500/20 rotate-180" />
                    </CardContent>
                </Card>
                <Card className="bg-background/40 backdrop-blur-md border-blue-500/20">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Avg. Change</p>
                            <h3 className={`text-2xl font-bold ${stats.avgChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {stats.avgChange >= 0 ? '+' : ''}{stats.avgChange.toFixed(2)}%
                            </h3>
                        </div>
                        <Activity className="h-8 w-8 text-blue-500/20" />
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden bg-background/40 backdrop-blur-xl border-border/50 shadow-2xl">
                <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-full" />
                            {indexName} Constituents
                        </CardTitle>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search symbol or name..." 
                                className="pl-9 bg-background/50 border-border/50 focus:ring-blue-500/50"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/20 text-muted-foreground font-medium uppercase text-[10px] tracking-widest border-b border-border/50">
                                <th className="px-6 py-4">Company</th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => { setSortBy("price"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>Price</th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => { setSortBy("changePercent"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>Change %</th>
                                <th className="px-6 py-4 text-right hidden md:table-cell">High</th>
                                <th className="px-6 py-4 text-right hidden md:table-cell">Low</th>
                                <th className="px-6 py-4 text-right hidden lg:table-cell">Market Cap</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredAndSortedStocks.map((stock) => {
                                const isPositive = stock.change >= 0
                                return (
                                    <tr key={stock.symbol} className="group hover:bg-muted/30 transition-all duration-300">
                                        <td className="px-6 py-4">
                                            <Link href={`/stock/${stock.symbol}`} className="flex items-center gap-3 group/item">
                                                {stock.logoUrl ? (
                                                    <img src={stock.logoUrl} alt="" className="w-8 h-8 rounded-full bg-white p-1 border border-border/50 shadow-sm" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-500 text-xs">
                                                        {stock.symbol.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-foreground group-hover/item:text-blue-500 transition-colors">{stock.name}</div>
                                                    <div className="text-[10px] text-muted-foreground font-mono">{stock.symbol}</div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-medium text-xs">
                                            <FlashingDigits value={stock.price} decimals={2} prefix={currencySymbol} onlyLastTwo={false} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                            }`}>
                                                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                {Math.abs(stock.changePercent).toFixed(2)}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-[10px] hidden md:table-cell text-emerald-500/80">
                                            {currencySymbol}{stock.fiftyTwoWeekHigh?.toFixed(2) || "---"}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-[10px] hidden md:table-cell text-rose-500/80">
                                            {currencySymbol}{stock.fiftyTwoWeekLow?.toFixed(2) || "---"}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-[10px] hidden lg:table-cell text-muted-foreground">
                                            {stock.marketCap ? `${currencySymbol}${(stock.marketCap / 1e9).toFixed(2)}B` : "---"}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    )
}
