"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SP500HeatmapProps {
    height?: string;
}

export function SP500Heatmap({ height = "600px" }: SP500HeatmapProps) {
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
        <Card className="w-full h-full overflow-hidden flex flex-col border-none shadow-none bg-background">
            <CardContent className="flex-1 min-h-0 p-0">
                <div className="w-full h-full" style={{ height: height }}>
                    <div ref={containerRef} className="tradingview-widget-container h-full w-full">
                        <div className="tradingview-widget-container__widget h-full w-full"></div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
