import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import Link from "next/link"
import { checkMarketOpen } from "@/lib/market"
import { FlashingDigits } from "@/components/FlashingDigits"

interface StockData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    name: string;
    logoUrl?: string;
    currency?: string;
    isLive?: boolean;
}

interface StockCardProps {
    stock: StockData;
}

export function StockCard({ stock }: StockCardProps) {
    const isPositive = stock.change >= 0;
    const decimals = stock.symbol === 'EUR=X' ? 4 : 2;

    const [flashBg, setFlashBg] = useState("");
    const [isMarketOpen, setIsMarketOpen] = useState(true);
    const prevPriceRef = useRef(stock.price);

    useEffect(() => {
        setIsMarketOpen(checkMarketOpen());
        const interval = setInterval(() => {
            setIsMarketOpen(checkMarketOpen());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (stock.price !== prevPriceRef.current) {
            const isIncrease = stock.price > prevPriceRef.current;
            setFlashBg(isIncrease ? "bg-green-500/10" : "bg-red-500/10");

            const timer = setTimeout(() => {
                setFlashBg("");
            }, 1000);

            prevPriceRef.current = stock.price;
            return () => clearTimeout(timer);
        }
    }, [stock.price]);

    return (
        <Link href={`/stock/${stock.symbol}`} className="h-full block">
            <Card className={`w-full h-full hover:bg-accent/50 transition-colors duration-1000 cursor-pointer flex flex-col justify-between ${flashBg}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                        {stock.symbol === 'BTC-USD' ? (
                            <div className="shrink-0 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                                ₿
                            </div>
                        ) : (
                            <div className="shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-border p-1 shadow-sm">
                                <img
                                    src={stock.logoUrl || `https://ui-avatars.com/api/?name=${stock.symbol}&background=random&color=fff&rounded=true`}
                                    alt=""
                                    className="w-full h-full object-contain rounded-full"
                                />
                            </div>
                        )}
                        <div className="overflow-hidden">
                            <CardTitle className="text-base font-bold leading-none truncate flex items-center gap-2">
                                {stock.symbol}
                                {!stock.symbol.includes('=') && !stock.symbol.includes('^') && !stock.symbol.includes('-') && (
                                    <span 
                                        className={`flex h-2 w-2 rounded-full shrink-0 ${isMarketOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} 
                                        title={isMarketOpen ? "Market Open (Alpaca Real-time)" : "Market Closed (Last Price)"} 
                                    />
                                )}
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground uppercase mt-0.5 font-medium truncate">
                                {stock.name}
                            </p>
                        </div>
                    </div>
                    {isPositive ? (
                        <ArrowUpIcon className="h-4 w-4 shrink-0 text-green-500" />
                    ) : (
                        <ArrowDownIcon className="h-4 w-4 shrink-0 text-red-500" />
                    )}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                        <FlashingDigits value={stock.price} decimals={decimals} prefix="$" onlyLastTwo={false} />
                        {stock.isLive && (
                            <span className="bg-blue-500/10 text-blue-500 text-[10px] px-1.5 py-0.5 rounded border border-blue-500/20 font-bold animate-pulse">
                                VPS
                            </span>
                        )}
                    </div>
                    <p className={`text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}>
                        {isPositive ? "+" : ""}{stock.change.toFixed(decimals)} US$ ({stock.changePercent.toFixed(2)}%)
                    </p>
                </CardContent>
            </Card>
        </Link>
    )
}
