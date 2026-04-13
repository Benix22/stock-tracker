import { WorldIndices } from "@/components/WorldIndices";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "World Macro Indicators | StockTracker",
    description: "Detailed macroeconomic indicators for major world economies including PIB, IPC, and Unemployment rates.",
};

export default function WorldIndicesPage() {
    return (
        <div className="min-h-screen bg-background p-4 md:p-8 pt-24">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col gap-4">
                    <Link 
                        href="/" 
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter">Global Macro Analysis</h1>
                        <p className="text-muted-foreground text-lg">In-depth economic indicators and world market indices</p>
                    </div>
                </div>

                <div className="bg-card border rounded-3xl p-6 md:p-10 shadow-sm">
                    <WorldIndices showMacro={true} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                    <div className="bg-secondary/20 border border-border/50 rounded-2xl p-6">
                        <h3 className="font-bold text-lg mb-2">About these indicators</h3>
                        <p className="text-sm text-muted-foreground">
                            These indicators are sourced in real-time from official institutions like 
                            <b> Eurostat</b> for European countries and the <b>FRED (Federal Reserve Economic Data)</b> for the United States. 
                            Macroeconomic data is updated periodically as official reports are released.
                        </p>
                    </div>
                    <div className="bg-secondary/20 border border-border/50 rounded-2xl p-6">
                        <h3 className="font-bold text-lg mb-2">Usage Tip</h3>
                        <p className="text-sm text-muted-foreground">
                            Use these indicators to understand the fundamental economic context of the markets you are trading. 
                            High inflation (IPC) or slowing GDP (PIB) can significantly impact stock market performance and interest rate decisions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
