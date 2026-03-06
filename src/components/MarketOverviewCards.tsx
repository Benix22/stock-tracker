"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { getBatchStockQuotes } from "@/actions/stock"
import { FlashingDigits } from "@/components/FlashingDigits"

export function MarketOverviewCards() {
    const [cryptoData, setCryptoData] = useState({ price: 2.39, change: -6.72 })
    const [dxyData, setDxyData] = useState({ price: 98.801, change: 1.67 })
    const [bondData, setBondData] = useState({ price: 3.245, change: -0.15 })

    const [cryptoStocks, setCryptoStocks] = useState([
        { name: "Bitcoin", symbol: "BTC-USD", price: 71410, change: 4.50, icon: "₿", color: "bg-orange-500" },
        { name: "Ethereum", symbol: "ETH-USD", price: 2059.4, change: 3.85, icon: "Ξ", color: "bg-blue-400" }
    ])

    const [commodities, setCommodities] = useState([
        { name: "Crude oil", symbol: "CL=F", price: 74.06, unit: "USD / barrel", change: -0.67, isPos: false, icon: "💧" },
        { name: "Natural gas", symbol: "NG=F", price: 2.934, unit: "USD / million BTUs", change: -3.93, isPos: false, icon: "🔥" },
        { name: "Gold", symbol: "GC=F", price: 5205.2, unit: "USD / troy ounce", change: 1.59, isPos: true, icon: "🥇" },
        { name: "Copper", symbol: "HG=F", price: 5.9240, unit: "USD / pound", change: 1.68, isPos: true, icon: "🧱" },
    ])

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const symbols = ["BTC-USD", "ETH-USD", "CL=F", "NG=F", "GC=F", "HG=F"]
                const quotes = await getBatchStockQuotes(symbols)

                setCryptoStocks(prev => prev.map(s => {
                    const q = quotes.find(quote => quote.symbol === s.symbol)
                    return q ? { ...s, price: q.price, change: q.changePercent } : s
                }))

                setCommodities(prev => prev.map(s => {
                    const q = quotes.find(quote => quote.symbol === s.symbol)
                    return q ? { ...s, price: q.price, change: q.changePercent, isPos: q.change >= 0 } : s
                }))

                const simulateUpdate = (prev: number) => {
                    const variation = (Math.random() - 0.5) * 0.005
                    return prev * (1 + variation)
                }

                setCryptoData(prev => ({ ...prev, price: simulateUpdate(prev.price) }))
                setDxyData(prev => ({ ...prev, price: simulateUpdate(prev.price) }))
                setBondData(prev => ({ ...prev, price: simulateUpdate(prev.price) }))

            } catch (error) {
                console.error("Failed to update market overview data", error)
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Crypto Market Overview */}
            <Card className="flex flex-col">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                                G
                            </div>
                            <CardTitle className="text-sm font-semibold">Crypto market cap</CardTitle>
                            <span className="text-[10px] bg-secondary px-1 py-0.5 rounded text-secondary-foreground font-bold">TOTAL</span>
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold">
                        <FlashingDigits value={cryptoData.price} suffix=" T" /> <span className="text-xs font-normal text-muted-foreground">USD</span>
                    </div>
                    <div className={`text-sm font-medium ${cryptoData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {cryptoData.change >= 0 ? '+' : ''}{cryptoData.change.toFixed(2)}%
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 space-y-4 pt-4">
                    <div className="h-24 w-full bg-gradient-to-t from-red-500/10 to-transparent relative rounded overflow-hidden">
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                            <path
                                d="M0,50 Q20,30 40,60 T80,40 T120,70 T160,50 T200,80 T240,60 T280,90 T320,70 L320,100 L0,100 Z"
                                fill="currentColor"
                                className="text-red-500/20"
                            />
                            <path
                                d="M0,50 Q20,30 40,60 T80,40 T120,70 T160,50 T200,80 T240,60 T280,90 T320,70"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-red-500"
                            />
                        </svg>
                        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-muted-foreground">1 month</div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Bitcoin dominance</h4>
                        <div className="flex justify-between items-end mb-1">
                            <div>
                                <div className="text-[10px] flex items-center gap-1 text-muted-foreground mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Bitcoin
                                </div>
                                <div className="text-sm font-bold">59.66%</div>
                            </div>
                            <div>
                                <div className="text-[10px] flex items-center gap-1 text-muted-foreground mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Ethereum
                                </div>
                                <div className="text-sm font-bold">10.39%</div>
                            </div>
                            <div>
                                <div className="text-[10px] flex items-center gap-1 text-muted-foreground mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Others
                                </div>
                                <div className="text-sm font-bold">29.96%</div>
                            </div>
                        </div>
                        <div className="h-1.5 w-full flex rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '59.66%' }}></div>
                            <div className="h-full bg-green-500" style={{ width: '10.39%' }}></div>
                            <div className="h-full bg-red-500" style={{ width: '29.96%' }}></div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        {cryptoStocks.map((stock) => (
                            <div key={stock.symbol} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full ${stock.color} flex items-center justify-center text-white font-bold`}>{stock.icon}</div>
                                    <div>
                                        <div className="text-xs font-bold">{stock.name}</div>
                                        <div className="text-[10px] font-mono bg-secondary px-1 rounded inline-block">{stock.symbol.replace('-', '')}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold">
                                        <FlashingDigits value={stock.price} /> <span className="text-[10px] font-normal text-muted-foreground leading-none">USD</span>
                                    </div>
                                    <div className={`text-[10px] font-bold ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto pt-4 flex items-center text-xs font-bold text-blue-500 transition-colors group cursor-pointer">
                        See all crypto coins <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </CardContent>
            </Card>

            {/* Currencies & Commodities */}
            <Card className="flex flex-col">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold text-white">$</div>
                            <CardTitle className="text-sm font-semibold">US Dollar index</CardTitle>
                            <span className="text-[10px] bg-secondary px-1 py-0.5 rounded text-secondary-foreground font-bold">DXY</span>
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold">
                        <FlashingDigits value={dxyData.price} decimals={3} /> <span className="text-xs font-normal text-muted-foreground">USD</span>
                    </div>
                    <div className={`text-sm font-medium ${dxyData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {dxyData.change >= 0 ? '+' : ''}{dxyData.change.toFixed(2)}%
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 space-y-4 pt-4">
                    <div className="h-24 w-full bg-gradient-to-t from-green-500/10 to-transparent relative rounded overflow-hidden">
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                            <path
                                d="M0,80 Q40,90 80,70 T120,60 T160,50 T200,40 T240,30 T280,20 T320,20 L320,100 L0,100 Z"
                                fill="currentColor"
                                className="text-green-500/20"
                            />
                            <path
                                d="M0,80 Q40,90 80,70 T120,60 T160,50 T200,40 T240,30 T280,20 T320,20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-green-500"
                            />
                        </svg>
                        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-muted-foreground">1 month</div>
                    </div>

                    <div className="space-y-3 pt-2">
                        {commodities.map((item) => (
                            <div key={item.symbol} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs">{item.icon}</div>
                                    <div>
                                        <div className="text-xs font-bold flex items-center gap-1">
                                            {item.name} <span className="text-[10px] text-orange-500">D</span>
                                        </div>
                                        <div className="text-[10px] font-mono bg-secondary px-1 rounded inline-block">{item.symbol.replace('=F', '1!')}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold leading-none">
                                        <FlashingDigits value={item.price} decimals={item.symbol === 'HG=F' ? 4 : 2} /> <span className="text-[10px] font-normal text-muted-foreground">{item.unit}</span>
                                    </div>
                                    <div className={`text-[10px] font-bold ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto pt-2 flex items-center text-xs font-bold text-blue-500 transition-colors group cursor-pointer">
                        See all futures <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </CardContent>
            </Card>

            {/* Economic Indicators */}
            <Card className="flex flex-col">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs text-white shadow-sm border border-red-600">🇪🇸</div>
                            <CardTitle className="text-sm font-semibold">Spain 10-year yield</CardTitle>
                            <span className="text-[10px] bg-secondary px-1 py-0.5 rounded text-secondary-foreground font-bold uppercase overflow-hidden max-w-[60px] truncate">ES10Y</span>
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold">
                        <FlashingDigits value={bondData.price} decimals={3} suffix="%" />
                    </div>
                    <div className={`text-sm font-medium ${bondData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {bondData.change >= 0 ? '+' : ''}{bondData.change.toFixed(2)}%
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 space-y-6 pt-4">
                    <div className="h-24 w-full bg-gradient-to-t from-orange-500/10 to-transparent relative rounded overflow-hidden">
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                            <path
                                d="M0,40 Q40,30 80,50 T120,60 T160,55 T200,45 T240,40 T280,35 T320,45 L320,100 L0,100 Z"
                                fill="currentColor"
                                className="text-orange-500/20"
                            />
                            <path
                                d="M0,40 Q40,30 80,50 T120,60 T160,55 T200,45 T240,40 T280,35 T320,45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-orange-500"
                            />
                        </svg>
                        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-muted-foreground">1 month</div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold">Spain annual inflation rate</h4>
                            <span className="text-[10px] font-mono bg-secondary px-1 rounded inline-block">ESCPYY</span>
                        </div>
                        <div className="flex items-end justify-between h-24 gap-1 px-1">
                            {[0.5, 0.45, 0.55, 0.6, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3].map((h, i) => (
                                <div key={i} className="bg-orange-500/80 hover:bg-orange-500 transition-colors w-full rounded-t-sm" style={{ height: `${h * 100}%` }}></div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[8px] text-muted-foreground uppercase font-bold px-1">
                            <span>2025</span>
                            <span>Apr</span>
                            <span>Jul</span>
                            <span>2026</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-bold">ECB interest rate</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <div className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-tight">Actual</div>
                                <div className="text-sm font-bold">2.15%</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-tight">Forecast</div>
                                <div className="text-sm font-bold">2.15%</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-tight">Next release</div>
                                <div className="text-xs font-bold">Mar 12, 2026</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-2 flex items-center text-xs font-bold text-blue-500 transition-colors group cursor-pointer">
                        See all economic indicators <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
