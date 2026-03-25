"use client"

import { SP500Heatmap } from "@/components/SP500Heatmap";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function HeatmapPage() {
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Market Heatmap</h1>
                        <p className="text-muted-foreground mt-1">Visualizing S&P 500 performance in real-time</p>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground bg-muted px-3 py-1 rounded-full border">
                        S&P 500 • REAL-TIME DATA
                    </div>
                </div>

                <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-1 h-[70vh]">
                    <SP500Heatmap height="100%" />
                </div>
            </div>
        </div>
    );
}
