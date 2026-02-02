import { StockDetailClient } from "@/components/StockDetailClient";
import { getStockQuote, getStockPerformance, getStockNews } from "@/lib/stock-api";
import { StockNews } from "@/components/StockNews";
import { StockFundamentals } from "@/components/StockFundamentals";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
    params: Promise<{ symbol: string }>;
}

export default async function StockDetailPage({ params }: PageProps) {
    const { symbol } = await params;
    const [quote, performance, news] = await Promise.all([
        getStockQuote(symbol),
        getStockPerformance(symbol),
        getStockNews(symbol)
    ]);

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>

                <header>
                    <h1 className="text-4xl font-bold tracking-tight">
                        {quote?.name || symbol} ({symbol})
                    </h1>
                    <p className="text-muted-foreground">Real-time intraday values</p>
                </header>

                <StockDetailClient symbol={symbol} initialPerformance={performance} />

                {quote && <StockFundamentals quote={quote} />}

                <StockNews news={news} symbol={symbol} />
            </div>
        </div>
    );
}
