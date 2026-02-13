
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StockPerformance } from "@/lib/stock-api"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

interface StockPerformanceProps {
    performance: StockPerformance;
    livePrice?: number | null;
    symbol: string;
}

export function StockPerformanceTable({ performance, livePrice, symbol }: StockPerformanceProps) {
    if (!performance) return null;

    const currentPrice = livePrice || performance.currentPrice;
    const decimals = symbol === 'EUR=X' ? 4 : 2;

    const calculateMetric = (baseMetric: any) => {
        const oldPrice = baseMetric.price; // historical price
        const change = currentPrice - oldPrice;
        const percent = (change / oldPrice) * 100;
        return { change, percent };
    };

    const periods = [
        { label: "1 Day", metric: calculateMetric(performance.perf1d) },
        { label: "5 Days", metric: calculateMetric(performance.perf5d) },
        { label: "1 Month", metric: calculateMetric(performance.perf1m) },
        { label: "6 Months", metric: calculateMetric(performance.perf6m) },
    ];

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Period</TableHead>
                            <TableHead className="text-right">Return %</TableHead>
                            <TableHead className="text-right">Value Change</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {periods.map((period) => {
                            const isPositive = period.metric.change >= 0;
                            const ColorIcon = isPositive ? ArrowUpIcon : ArrowDownIcon;
                            const colorClass = isPositive ? "text-green-500" : "text-red-500";

                            return (
                                <TableRow key={period.label}>
                                    <TableCell className="font-medium">{period.label}</TableCell>
                                    <TableCell className={`text-right font-bold ${colorClass}`}>
                                        <div className="flex items-center justify-end">
                                            <ColorIcon className="mr-1 h-3 w-3" />
                                            {isPositive ? "+" : ""}{period.metric.percent.toFixed(2)}%
                                        </div>
                                    </TableCell>
                                    <TableCell className={`text-right ${colorClass}`}>
                                        {isPositive ? "+" : ""}{period.metric.change.toFixed(decimals)} US$
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
