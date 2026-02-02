"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NewsArticle } from "@/lib/stock-api"
import { ExternalLink, Calendar } from "lucide-react"

interface StockNewsProps {
    news: NewsArticle[]
    symbol: string
}

export function StockNews({ news, symbol }: StockNewsProps) {
    if (!news || news.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Latest News</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No recent news found for {symbol}.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Latest News for {symbol}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {news.map((article) => (
                        <div key={article.uuid} className="group flex flex-col sm:flex-row gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border">
                            {article.thumbnail?.resolutions?.[0]?.url && (
                                <div className="flex-shrink-0">
                                    <img
                                        src={article.thumbnail.resolutions[0].url}
                                        alt={article.title}
                                        className="w-full sm:w-24 sm:h-24 object-cover rounded-md"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                            <div className="flex-1 space-y-2">
                                <a
                                    href={article.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block font-semibold group-hover:text-primary transition-colors"
                                >
                                    {article.title}
                                    <ExternalLink className="inline-block ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                                <div className="flex items-center text-xs text-muted-foreground gap-2">
                                    <span className="font-medium text-foreground">{article.publisher}</span>
                                    <span>•</span>
                                    <span className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {new Date(article.providerPublishTime).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
