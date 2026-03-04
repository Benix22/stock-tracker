"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SP500Heatmap() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clean up previous widget if any
        containerRef.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "dataSource": "S&P500",
            "grouping": "sector",
            "blockSize": "market_cap_basic",
            "blockColor": "change",
            "colorTheme": "dark",
            "hasSymbolTooltip": true,
            "isResponsive": true,
            "displayMode": "regular",
            "width": "100%",
            "height": "100%",
            "locale": "en"
        });

        containerRef.current.appendChild(script);
    }, []);

    return (
        <Card className="w-full overflow-hidden">
            <CardHeader className="py-4">
                <CardTitle className="flex justify-between items-center text-xl">
                    <span>S&P 500 Heatmap</span>
                    <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider">TradingView Market Sentiment</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="w-full h-[600px] rounded-lg overflow-hidden border border-border/50">
                    <div ref={containerRef} className="tradingview-widget-container h-full w-full">
                        <div className="tradingview-widget-container__widget h-full w-full"></div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
