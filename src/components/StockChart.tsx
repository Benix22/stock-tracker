"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HistoricalDataPoint {
    date: string;
    close: number;
}

interface StockChartProps {
    data: HistoricalDataPoint[];
    symbol: string;
    color?: string;
    domain?: [number | "auto", number | "auto"];
}

export function StockChart({ data, symbol, color = "#2563eb", domain }: StockChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>{symbol} History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    const minPrice = Math.min(...data.map(d => d.close));
    const maxPrice = Math.max(...data.map(d => d.close));
    const domainMin = Math.floor(minPrice * 0.95);
    const domainMax = Math.ceil(maxPrice * 1.05);

    // Use provided domain or default calculation
    const currentDomain = domain || [domainMin, domainMax];

    const decimals = symbol === 'EUR=X' ? 4 : 2;

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>{symbol} Evolution</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`color-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                            }}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={currentDomain}
                            tickFormatter={(value) => `$${Number(value).toFixed(decimals)}`}
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            formatter={(value: any) => [`$${Number(value).toFixed(decimals)}`, "Price"]}
                            labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        />
                        <Area
                            type="monotone"
                            dataKey="close"
                            stroke={color}
                            fillOpacity={1}
                            fill={`url(#color-${symbol})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
