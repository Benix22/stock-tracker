"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SP500Heatmap() {
    return (
        <Card className="w-full overflow-hidden">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>S&P 500 Heatmap</span>
                    <span className="text-sm font-normal text-muted-foreground">Source: TradingView</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative w-full aspect-[16/9] min-h-[500px]">
                    <iframe
                        src="https://www.tradingview.com/embed-widget/heatmap/?locale=en#%7B%22symbol%22%3A%22SPX%22%2C%22colorTheme%22%3A%22dark%22%2C%22isDataSetEnabled%22%3Atrue%2C%22isZoomEnabled%22%3Atrue%2C%22hasSymbolTooltip%22%3Atrue%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%7D"
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none"
                        }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
