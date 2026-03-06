"use client"

import { SP500Heatmap } from "@/components/SP500Heatmap";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function HeatmapPage() {
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>

                <header>
                    <h1 className="text-4xl font-bold tracking-tight">Market Heatmap</h1>
                    <p className="text-muted-foreground">S&P 500 Sentiment and Performance by Sector</p>
                </header>

                <div className="w-full">
                    <SP500Heatmap height="800px" />
                </div>
            </div>
        </div>
    );
}
