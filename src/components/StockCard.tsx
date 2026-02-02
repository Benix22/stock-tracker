import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import Link from "next/link"

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

    return (
        <Link href={`/stock/${stock.symbol}`} className="h-full block">
            <Card className="w-full h-full hover:bg-accent/50 transition-colors cursor-pointer flex flex-col justify-between">
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
                    <div className="text-2xl font-bold">${stock.price.toFixed(2)}</div>
                    <p className={`text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}>
                        {isPositive ? "+" : ""}{stock.change.toFixed(2)} US$ ({stock.changePercent.toFixed(2)}%)
                    </p>
                </CardContent>
            </Card>
        </Link>
    )
}
