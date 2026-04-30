"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { getBatchStockQuotes } from "@/actions/stock"
import { checkMarketOpen } from "@/lib/market"
import { FlashingDigits } from "@/components/FlashingDigits"
import Link from "next/link"

import { OVERVIEW_SYMBOLS } from "@/lib/constants";

export function MarketOverviewCards({ initialQuotes = [], disablePolling = false }: { initialQuotes?: any[], disablePolling?: boolean }) {
    const [cryptoData, setCryptoData] = useState({ price: 2.39, change: -6.72 })
    const [dxyData, setDxyData] = useState({ price: 98.801, change: 1.67 })
    const [currenciesData, setCurrenciesData] = useState({ price: 1.0854, change: 0.12 })
    const [isMarketOpen, setIsMarketOpen] = useState(checkMarketOpen())

    useEffect(() => {
        const interval = setInterval(() => {
            setIsMarketOpen(checkMarketOpen());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const [cryptoStocks, setCryptoStocks] = useState([
        { name: "Bitcoin", symbol: "BTC-USD", price: 71500, change: 4.50, icon: "₿", color: "bg-orange-500" },
        { name: "Ethereum", symbol: "ETH-USD", price: 2100, change: 3.85, icon: "Ξ", color: "bg-blue-400" }
    ])

    const [commodities, setCommodities] = useState([
        { name: "Brent Crude Oil", symbol: "BZ=F", price: 82.50, unit: "USD/Bbl", change: 0.82, isPos: true, icon: "💧" },
        { name: "Natural gas", symbol: "NG=F", price: 3.304, unit: "USD / million BTUs", change: -3.93, isPos: false, icon: "🔥" },
        { name: "Gold", symbol: "GC=F", price: 5088.6, unit: "USD / troy ounce", change: 1.59, isPos: true, icon: "🥇" },
        { name: "Copper", symbol: "HG=F", price: 5.787, unit: "USD / pound", change: 1.68, isPos: true, icon: "🧱" },
    ])

    const [currencies, setCurrencies] = useState([
        { name: "GBP / USD", symbol: "GBPUSD=X", price: 1.2650, change: 0.15, icon: "£" },
        { name: "USD / JPY", symbol: "JPY=X", price: 151.42, change: -0.05, icon: "¥" },
        { name: "USD / CHF", symbol: "CHF=X", price: 0.9015, change: 0.08, icon: "₣" },
        { name: "AUD / USD", symbol: "AUDUSD=X", price: 0.6520, change: -0.12, icon: "A$" },
    ])

    const processQuotes = (quotes: any[]) => {
        if (!quotes || quotes.length === 0) return;

        setCryptoStocks(prev => prev.map(s => {
            const q = quotes.find(quote => quote?.symbol === s.symbol)
            return q ? { ...s, price: q.price, change: q.changePercent } : s
        }))

        setCommodities(prev => prev.map(s => {
            const q = quotes.find(quote => quote?.symbol === s.symbol)
            return q ? { ...s, price: q.price, change: q.changePercent, isPos: q.change >= 0 } : s
        }))

        setCurrencies(prev => prev.map(s => {
            const q = quotes.find(quote => quote?.symbol === s.symbol)
            return q ? { ...s, price: q.price, change: q.changePercent } : s
        }))

        const eur = quotes.find(q => q?.symbol === "EURUSD=X")
        if (eur) setCurrenciesData({ price: eur.price, change: eur.changePercent })
    }

    const updateMarketData = async () => {
        try {
            const quotes = await getBatchStockQuotes(OVERVIEW_SYMBOLS)
            processQuotes(quotes)

            const simulateUpdate = (prev: number) => {
                const variation = (Math.random() - 0.5) * 0.005
                return prev * (1 + variation)
            }

            setCryptoData(prev => ({ ...prev, price: simulateUpdate(prev.price) }))
            setDxyData(prev => ({ ...prev, price: simulateUpdate(prev.price) }))

        } catch (error) {
            console.error("Failed to update market overview data", error)
        }
    }

    useEffect(() => {
        let mounted = true;

        if (initialQuotes && initialQuotes.length > 0) {
            processQuotes(initialQuotes);
        } else {
            updateMarketData();
        }

        if (!disablePolling) {
            const pollInterval = isMarketOpen ? 5000 : 1000;
            const interval = setInterval(async () => {
                try {
                    const quotes = await getBatchStockQuotes(OVERVIEW_SYMBOLS)
                    if (mounted) {
                        processQuotes(quotes)
                        
                        const simulateUpdate = (prev: number) => {
                            const variation = (Math.random() - 0.5) * 0.005
                            return prev * (1 + variation)
                        }

                        setCryptoData(prev => ({ ...prev, price: simulateUpdate(prev.price) }))
                        setDxyData(prev => ({ ...prev, price: simulateUpdate(prev.price) }))
                    }
                } catch (error) {
                    if (mounted) console.error("Failed to update market overview data", error)
                }
            }, pollInterval)
            
            return () => {
                mounted = false;
                clearInterval(interval);
            };
        }
        
        return () => { mounted = false; };
    }, [initialQuotes, disablePolling, isMarketOpen])



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

                    <div className="space-y-1 pt-2">
                        {cryptoStocks.map((stock) => (
                            <Link 
                                key={stock.symbol} 
                                href={`/stock/${stock.symbol}`}
                                className="flex items-center justify-between hover:bg-accent/50 transition-colors cursor-pointer rounded-xl -mx-2 px-2 py-2 group/item"
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full ${stock.color} flex items-center justify-center text-white font-bold transition-transform group-hover/item:scale-110`}>{stock.icon}</div>
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
                            </Link>
                        ))}
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

                    <div className="space-y-1 pt-2">
                        {commodities.map((item) => (
                            <Link 
                                key={item.symbol} 
                                href={`/stock/${item.symbol}`}
                                className="flex items-center justify-between py-2 hover:bg-accent/50 transition-colors cursor-pointer rounded-xl -mx-2 px-2 group/item"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs transition-transform group-hover/item:scale-110">{item.icon}</div>
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
                            </Link>
                        ))}
                    </div>

                </CardContent>
            </Card>

            {/* Major Currencies */}
            <Card className="flex flex-col">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">€</div>
                            <CardTitle className="text-sm font-semibold">Euro / US Dollar</CardTitle>
                            <span className="text-[10px] bg-secondary px-1 py-0.5 rounded text-secondary-foreground font-bold uppercase">EURUSD</span>
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold">
                        <FlashingDigits value={currenciesData.price} decimals={4} /> <span className="text-xs font-normal text-muted-foreground">USD</span>
                    </div>
                    <div className={`text-sm font-medium ${currenciesData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {currenciesData.change >= 0 ? '+' : ''}{currenciesData.change.toFixed(2)}%
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 space-y-4 pt-4">
                    <div className="h-24 w-full bg-gradient-to-t from-blue-500/10 to-transparent relative rounded overflow-hidden">
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                            <path
                                d="M0,60 Q40,40 80,70 T120,50 T160,80 T200,60 T240,90 T280,70 T320,80 L320,100 L0,100 Z"
                                fill="currentColor"
                                className="text-blue-500/20"
                            />
                            <path
                                d="M0,60 Q40,40 80,70 T120,50 T160,80 T200,60 T240,90 T280,70 T320,80"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-blue-500"
                            />
                        </svg>
                        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-muted-foreground">1 month</div>
                    </div>

                    <div className="space-y-1 pt-2">
                        {currencies.map((item) => (
                            <Link 
                                key={item.symbol} 
                                href={`/stock/${item.symbol}`}
                                className="flex items-center justify-between py-2 hover:bg-accent/50 transition-colors cursor-pointer rounded-xl -mx-2 px-2 group/item"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs transition-transform group-hover/item:scale-110">{item.icon}</div>
                                    <div>
                                        <div className="text-xs font-bold flex items-center gap-1">
                                            {item.name}
                                        </div>
                                        <div className="text-[10px] font-mono bg-secondary px-1 rounded inline-block">{item.symbol.replace('=X', '')}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold leading-none">
                                        <FlashingDigits value={item.price} decimals={item.symbol.includes('JPY') ? 2 : 4} />
                                    </div>
                                    <div className={`text-[10px] font-bold ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
