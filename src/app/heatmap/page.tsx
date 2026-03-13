"use client"

import { SP500Heatmap } from "@/components/SP500Heatmap";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function HeatmapPage() {
    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-4 p-4 border-b bg-card/50 backdrop-blur-md">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 px-3 py-1.5 rounded-lg transition-colors border">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Dashboard
                </Link>

                <header className="flex-1 text-center">
                    <h1 className="text-xl font-bold tracking-tight">Market Intelligence Heatmap</h1>
                </header>

                <div className="text-xs font-mono text-muted-foreground hidden md:block">
                    S&P 500 • REAL-TIME DATA
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <SP500Heatmap height="100%" />
            </div>
        </div>
    );
}
