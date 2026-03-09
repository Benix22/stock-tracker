"use client"

import { useEffect, useState, useRef } from "react";
import { getBatchStockQuotes } from "@/actions/stock";
import { StockData } from "@/lib/stock-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlashingDigits } from "@/components/FlashingDigits";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import Link from "next/link";

interface IndexInfo {
    symbol: string;
    name: string;
    region: string;
    countryCode: string;
}

const INDICES_CONFIG: IndexInfo[] = [
    { symbol: "^IBEX", name: "IBEX 35", region: "España", countryCode: "es" },
    { symbol: "^GSPC", name: "S&P 500", region: "USA", countryCode: "us" },
    { symbol: "^NDX", name: "Nasdaq 100", region: "USA", countryCode: "us" },
    { symbol: "^STOXX50E", name: "Euro Stoxx 50", region: "Europa", countryCode: "eu" },
    { symbol: "^GDAXI", name: "DAX", region: "Alemania", countryCode: "de" },
    { symbol: "^FCHI", name: "CAC 40", region: "Francia", countryCode: "fr" },
    { symbol: "FTSEMIB.MI", name: "FTSE MIB", region: "Italia", countryCode: "it" },
    { symbol: "^N225", name: "Nikkei 225", region: "Asia", countryCode: "jp" }
];

export function WorldIndices() {
    const [indicesData, setIndicesData] = useState<(StockData & IndexInfo)[]>([]);
    const [flashStates, setFlashStates] = useState<Record<string, string>>({});
    const prevPrices = useRef<Record<string, number>>({});

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const symbols = INDICES_CONFIG.map(i => i.symbol);
                const quotes = await getBatchStockQuotes(symbols);

                const combinedData = INDICES_CONFIG.map(config => {
                    const quote = quotes.find(q => q.symbol === config.symbol);
                    return { ...config, ...(quote || { price: 0, change: 0, changePercent: 0, symbol: config.symbol, name: config.name }) } as StockData & IndexInfo;
                });

                setIndicesData(combinedData);

                // Handle flashing for cards
                combinedData.forEach(index => {
                    const prevPrice = prevPrices.current[index.symbol];
                    if (prevPrice !== undefined && index.price !== prevPrice) {
                        const isIncrease = index.price > prevPrice;
                        setFlashStates(prev => ({
                            ...prev,
                            [index.symbol]: isIncrease ? "bg-green-500/10" : "bg-red-500/10"
                        }));
                        setTimeout(() => {
                            setFlashStates(prev => ({ ...prev, [index.symbol]: "" }));
                        }, 1000);
                    }
                    prevPrices.current[index.symbol] = index.price;
                });

            } catch (error) {
                console.error("Failed to fetch world indices", error);
            }
        };

        fetchIndices();
        const interval = setInterval(fetchIndices, 10000); // Update every 10s
        return () => clearInterval(interval);
    }, []);

    if (indicesData.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight px-1">World Indices</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {indicesData.map((index) => {
                    const isPositive = index.change >= 0;
                    const flashClass = flashStates[index.symbol] || "";

                    return (
                        <Link key={index.symbol} href={`/stock/${index.symbol}`} className="block h-full">
                            <Card
                                className={`w-full h-full transition-colors duration-1000 relative overflow-hidden ${flashClass} hover:bg-accent/50 cursor-pointer flex flex-col justify-between`}
                            >
                                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 gap-3">
                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                        <div className="shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-border p-0.5 shadow-sm">
                                            <img
                                                src={`https://flagcdn.com/w80/${index.countryCode}.png`}
                                                alt={index.region}
                                                className="w-full h-full object-cover rounded-full"
                                            />
                                        </div>
                                        <div className="overflow-hidden">
                                            <CardTitle className="text-sm font-bold leading-tight truncate">{index.name}</CardTitle>
                                            <p className="text-[10px] text-muted-foreground uppercase mt-0.5 font-medium tracking-wide">{index.region}</p>
                                        </div>
                                    </div>
                                    {isPositive ? (
                                        <ArrowUpIcon className="h-4 w-4 shrink-0 text-green-500" />
                                    ) : (
                                        <ArrowDownIcon className="h-4 w-4 shrink-0 text-red-500" />
                                    )}
                                </CardHeader>
                                <CardContent className="p-4 pt-1">
                                    <div className="text-2xl font-bold tracking-tight">
                                        <FlashingDigits value={index.price} decimals={2} onlyLastTwo={false} />
                                    </div>
                                    <div className={`text-xs font-bold flex items-center gap-1.5 mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                        <span>{isPositive ? '+' : ''}{index.change.toFixed(2)}</span>
                                        <span className="opacity-40 font-normal">|</span>
                                        <span>{isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
