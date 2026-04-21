"use client"

import { useEffect, useState } from "react";
import { getAIPrediction, PredictionResult } from "@/actions/ai-prediction";
import { TrendingUp, TrendingDown, Minus, Sparkles, AlertCircle, BrainCircuit, Crown } from "lucide-react";
import { getUserPlan } from "@/actions/subscription";
import { toast } from "sonner";

export function AIPrediction({ symbol, isIndex }: { symbol: string, isIndex: boolean }) {
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [userPlan, setUserPlan] = useState("FREE");

    useEffect(() => {
        async function init() {
            const plan = await getUserPlan();
            setUserPlan(plan);

            if (isIndex || plan === "FREE") {
                setLoading(false);
                return;
            }

            try {
                const res = await getAIPrediction(symbol);
                if (res) {
                    setPrediction(res);
                } else {
                    setError(true);
                }
            } catch (e) {
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        init();
    }, [symbol, isIndex]);

    if (isIndex) return null;

    if (loading) {
        return (
            <div className="w-full relative overflow-hidden rounded-2xl border border-border/50 p-6 bg-card/50 flex flex-col items-center justify-center min-h-[160px] backdrop-blur-sm animate-pulse">
                <BrainCircuit className="h-8 w-8 text-primary/40 mb-3" />
                <h3 className="font-medium text-foreground/70 mb-1">Analyzing Market with AI</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">Evaluating the last 30 days of history and fundamental metrics of {symbol}...</p>
            </div>
        );
    }

    if (userPlan === "FREE") {
        return (
            <div className="group w-full relative overflow-hidden rounded-[2rem] border border-white/5 p-4 bg-card/50 flex flex-col items-center justify-center min-h-[280px] backdrop-blur-sm my-8 transition-all hover:border-white/10">
                <div className="absolute inset-0 z-10 bg-background/30 backdrop-blur-[6px] flex items-center justify-center p-4">
                    <div className="text-center p-6 md:p-8 bg-[#050505] border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] max-w-sm w-full animate-in zoom-in-95 duration-500 border-t-white/20">
                        <div className="w-14 h-14 bg-amber-500/10 rounded-[1.2rem] flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <Crown className="w-7 h-7 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2 tracking-tighter">AI Verdict Locked</h3>
                        <p className="text-[11px] text-zinc-400 mb-6 leading-relaxed font-medium">Unlock predictive BUY/SELL signals and strategic reasoning for {symbol}.</p>
                        <button 
                            onClick={() => window.location.href = "/pricing"}
                            className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
                        >
                            Upgrade
                        </button>
                    </div>
                </div>
                
                {/* Faded Background to entice the user */}
                <div className="flex w-full gap-8 opacity-[0.04] pointer-events-none select-none blur-[4px] px-8">
                    <div className="flex items-center gap-6 md:min-w-[220px] shrink-0">
                        <div className="p-4 rounded-2xl bg-white/20 w-16 h-16" />
                        <div className="space-y-2">
                            <div className="w-20 h-3 bg-white/20 rounded-full" />
                            <div className="w-24 h-6 bg-white/20 rounded-xl" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-3 pt-2">
                        <div className="w-1/2 h-4 bg-white/20 rounded-full" />
                        <div className="w-full h-12 bg-white/20 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !prediction) {
        return (
            <div className="w-full rounded-2xl border border-destructive/20 p-5 bg-destructive/5 flex items-start gap-4 text-sm text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="font-semibold text-base mb-1">Predictive Model Unavailable</p>
                    <p className="text-destructive/80 leading-relaxed">AI could not be processed. Make sure to have <code className="bg-destructive/10 px-1 py-0.5 rounded font-mono text-xs">GEMINI_API_KEY</code> in your <code className="bg-destructive/10 px-1 py-0.5 rounded font-mono text-xs">.env.local</code> file.</p>
                </div>
            </div>
        );
    }

    const { signal, confidence, reasoning } = prediction;

    const signalConfig = {
        BUY: {
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            fill: "bg-emerald-500",
            blob: "from-emerald-500/0 to-emerald-500/10",
            icon: TrendingUp,
            label: "BUY",
            hoverRing: "hover:ring-emerald-500/20"
        },
        SELL: {
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            border: "border-rose-500/20",
            fill: "bg-rose-500",
            blob: "from-rose-500/0 to-rose-500/10",
            icon: TrendingDown,
            label: "SELL",
            hoverRing: "hover:ring-rose-500/20"
        },
        HOLD: {
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            fill: "bg-amber-500",
            blob: "from-amber-500/0 to-amber-500/10",
            icon: Minus,
            label: "HOLD",
            hoverRing: "hover:ring-amber-500/20"
        }
    };

    const config = signalConfig[signal as keyof typeof signalConfig] || signalConfig.HOLD;
    const Icon = config.icon;

    return (
        <div className={`group w-full relative overflow-hidden rounded-2xl border ${config.border} p-6 bg-card transition-all duration-500 hover:shadow-lg hover:shadow-black/5 ring-1 ring-transparent ${config.hoverRing} my-8`}>
            {/* Background Blob Glow */}
            <div className={`absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none rounded-full blur-[60px] translate-x-1/3 -translate-y-1/3 bg-gradient-to-br ${config.blob}`} />
            
            <div className="flex flex-col md:flex-row gap-6 relative z-10">
                {/* Left Side: Signal */}
                <div className="flex items-center gap-5 md:min-w-[200px] shrink-0">
                    <div className={`p-4 rounded-2xl ${config.bg} ${config.color} shrink-0 ring-1 ring-inset ${config.border} flex items-center justify-center`}>
                        <Icon className="h-8 w-8" strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 mb-1 opacity-90">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">AI Verdict</h3>
                        </div>
                        <div className={`text-2xl font-black tracking-tighter ${config.color} drop-shadow-sm`}>
                            {config.label}
                        </div>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden md:block w-px bg-border/60 self-stretch my-1" />

                {/* Right Side: Reasoning and Confidence */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-semibold tracking-wide text-foreground/70 uppercase">
                            Confidence: <span className={config.color}>{confidence}%</span>
                        </span>
                        <div className="h-1.5 flex-grow bg-secondary/80 rounded-full overflow-hidden max-w-[200px]">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-in-out ${config.fill}`}
                                style={{ width: `${confidence}%` }}
                            />
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed pr-4">
                        {reasoning}
                    </p>
                </div>
            </div>
        </div>
    );
}
