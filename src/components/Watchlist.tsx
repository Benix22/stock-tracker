"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWatchlist } from "@/hooks/use-watchlist";
import { getBatchStockQuotes } from "@/actions/stock";
import { StockData } from "@/lib/stock-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowUpIcon, ArrowDownIcon, Loader2, RefreshCw } from "lucide-react";

export function Watchlist() {
    const { watchlist, removeFromWatchlist, mounted } = useWatchlist();
    const [quotes, setQuotes] = useState<StockData[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchQuotes = async () => {
        if (watchlist.length === 0) {
            setQuotes([]);
            return;
        }
        setLoading(true);
        try {
            const data = await getBatchStockQuotes(watchlist);
            setQuotes(data);
        } catch (error) {
            console.error("Failed to fetch watchlist quotes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchQuotes();
        }
    }, [watchlist, mounted]);

    if (!mounted) return null;

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-lg">Watchlist</CardTitle>
                <Button variant="ghost" size="icon" onClick={fetchQuotes} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
                {watchlist.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                        No stocks in watchlist
                    </div>
                )}

                {quotes.map((quote) => {
                    const isPositive = quote.change >= 0;
                    return (
                        <div key={quote.symbol} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                            <Link href={`/stock/${quote.symbol}`} className="flex flex-col hover:underline">
                                <span className="font-bold">{quote.symbol}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[100px]">{quote.name}</span>
                            </Link>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="font-semibold">${quote.price.toFixed(2)}</span>
                                    <span className={`text-xs flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}>
                                        {isPositive ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                                        {Math.abs(quote.changePercent).toFixed(2)}%
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeFromWatchlist(quote.symbol)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
