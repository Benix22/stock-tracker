import { StockDetailClient } from "@/components/StockDetailClient";
import { getStockQuote, getStockPerformance, getStockNews, getStockRecommendations, getStockProfile } from "@/lib/stock-api";
import { StockNews } from "@/components/StockNews";
import { StockFundamentals } from "@/components/StockFundamentals";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
    params: Promise<{ symbol: string }>;
}

export default async function StockDetailPage({ params }: PageProps) {
    const { symbol } = await params;
    const decodedSymbol = decodeURIComponent(symbol);
    const [quote, performance, news, recommendations, profile] = await Promise.all([
        getStockQuote(decodedSymbol),
        getStockPerformance(decodedSymbol),
        getStockNews(decodedSymbol),
        getStockRecommendations(decodedSymbol),
        getStockProfile(decodedSymbol)
    ]);

    if (quote) {
        quote.recommendations = recommendations.recommendations;
        quote.targetPrice = recommendations.targetPrice;
        quote.targetHigh = recommendations.targetHigh;
        quote.targetLow = recommendations.targetLow;
        quote.targetMean = recommendations.targetMean;
        quote.consensus = recommendations.consensus;
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>

                <header>
                    <h1 className="text-4xl font-bold tracking-tight">
                        {quote?.name || decodedSymbol} ({decodedSymbol})
                    </h1>
                    <p className="text-muted-foreground">Real-time intraday values</p>
                </header>

                <StockDetailClient
                    symbol={decodedSymbol}
                    initialPerformance={performance}
                    profile={profile}
                />

                {quote && <StockFundamentals quote={quote} />}

                <StockNews news={news} symbol={decodedSymbol} />
            </div>
        </div>
    );
}
