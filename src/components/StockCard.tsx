import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import Link from "next/link"
import { useRef, useState, useEffect } from "react"

interface StockData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    name: string;
}

interface StockCardProps {
    stock: StockData;
}

export function StockCard({ stock }: StockCardProps) {
    const isPositive = stock.change >= 0;
    const decimals = stock.symbol === 'EUR=X' ? 4 : 2;

    const [flashClass, setFlashClass] = useState<string>("");
    const prevPriceRef = useRef<number>(stock.price);

    useEffect(() => {
        if (stock.price !== prevPriceRef.current) {
            const isIncrease = stock.price > prevPriceRef.current;
            setFlashClass(isIncrease ? "bg-green-500/20" : "bg-red-500/20");

            const timer = setTimeout(() => {
                setFlashClass("");
            }, 300);

            prevPriceRef.current = stock.price;
            return () => clearTimeout(timer);
        }
    }, [stock.price]);

    return (
        <Link href={`/stock/${stock.symbol}`} className="h-full block">
            <Card className={`w-full h-full hover:bg-accent/50 transition-colors cursor-pointer flex flex-col justify-between ${flashClass} duration-300`}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium leading-tight">
                        {stock.name} ({stock.symbol})
                    </CardTitle>
                    {isPositive ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-500" />
                    ) : (
                        <ArrowDownIcon className="h-4 w-4 text-red-500" />
                    )}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${stock.price.toFixed(decimals)}</div>
                    <p className={`text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}>
                        {isPositive ? "+" : ""}{stock.change.toFixed(decimals)} US$ ({stock.changePercent.toFixed(2)}%)
                    </p>
                </CardContent>
            </Card>
        </Link>
    )
}
