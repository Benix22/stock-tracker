"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Landmark, TrendingUp, Users, Activity, ChevronRight, Info, Zap, Scale } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useMemo, useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";

interface MacroEvent {
    type: 'FED' | 'ECB' | 'CPI' | 'NFP' | 'GDP';
    date: string;
    title: string;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
}

const ALL_EVENTS: MacroEvent[] = [
    // FED
    { type: 'FED', date: '2026-04-29', title: 'FOMC Interest Rate Decision', description: 'Federal Reserve announces target interest rates and monetary policy stance.', impact: 'High' },
    { type: 'FED', date: '2026-06-17', title: 'FOMC Interest Rate Decision', description: 'Federal Reserve announces target interest rates and monetary policy stance.', impact: 'High' },
    { type: 'FED', date: '2026-07-29', title: 'FOMC Interest Rate Decision', description: 'Federal Reserve announces target interest rates and monetary policy stance.', impact: 'High' },
    { type: 'FED', date: '2026-09-16', title: 'FOMC Interest Rate Decision', description: 'Federal Reserve announces target interest rates and monetary policy stance.', impact: 'High' },
    { type: 'FED', date: '2026-10-28', title: 'FOMC Interest Rate Decision', description: 'Federal Reserve announces target interest rates and monetary policy stance.', impact: 'High' },
    { type: 'FED', date: '2026-12-09', title: 'FOMC Interest Rate Decision', description: 'Federal Reserve announces target interest rates and monetary policy stance.', impact: 'High' },
    
    // ECB
    { type: 'ECB', date: '2026-04-30', title: 'ECB Monetary Policy Meeting', description: 'European Central Bank decides on Eurozone interest rates.', impact: 'High' },
    { type: 'ECB', date: '2026-06-11', title: 'ECB Monetary Policy Meeting', description: 'European Central Bank decides on Eurozone interest rates.', impact: 'High' },
    { type: 'ECB', date: '2026-07-23', title: 'ECB Monetary Policy Meeting', description: 'European Central Bank decides on Eurozone interest rates.', impact: 'High' },
    { type: 'ECB', date: '2026-09-10', title: 'ECB Monetary Policy Meeting', description: 'European Central Bank decides on Eurozone interest rates.', impact: 'High' },
    { type: 'ECB', date: '2026-10-29', title: 'ECB Monetary Policy Meeting', description: 'European Central Bank decides on Eurozone interest rates.', impact: 'High' },
    { type: 'ECB', date: '2026-12-17', title: 'ECB Monetary Policy Meeting', description: 'European Central Bank decides on Eurozone interest rates.', impact: 'High' },

    // NFP (Employment)
    { type: 'NFP', date: '2026-04-03', title: 'Non-Farm Payrolls (NFP)', description: 'US Employment Situation report. Critical for labor market health.', impact: 'High' },
    { type: 'NFP', date: '2026-05-08', title: 'Non-Farm Payrolls (NFP)', description: 'US Employment Situation report.', impact: 'High' },
    { type: 'NFP', date: '2026-06-05', title: 'Non-Farm Payrolls (NFP)', description: 'US Employment Situation report.', impact: 'High' },
    { type: 'NFP', date: '2026-08-07', title: 'Non-Farm Payrolls (NFP)', description: 'US Employment Situation report.', impact: 'High' },
    { type: 'NFP', date: '2026-09-04', title: 'Non-Farm Payrolls (NFP)', description: 'US Employment Situation report.', impact: 'High' },
    { type: 'NFP', date: '2026-10-02', title: 'Non-Farm Payrolls (NFP)', description: 'US Employment Situation report.', impact: 'High' },
    { type: 'NFP', date: '2026-11-06', title: 'Non-Farm Payrolls (NFP)', description: 'US Employment Situation report.', impact: 'High' },
    { type: 'NFP', date: '2026-12-04', title: 'Non-Farm Payrolls (NFP)', description: 'US Employment Situation report.', impact: 'High' },

    // CPI (Inflation)
    { type: 'CPI', date: '2026-04-10', title: 'US Consumer Price Index (CPI)', description: 'Key measure of US inflation. Heavy influence on Fed decisions.', impact: 'High' },
    { type: 'CPI', date: '2026-05-13', title: 'US Consumer Price Index (CPI)', description: 'Monthly inflation report.', impact: 'High' },
    { type: 'CPI', date: '2026-06-10', title: 'US Consumer Price Index (CPI)', description: 'Monthly inflation report.', impact: 'High' },
    { type: 'CPI', date: '2026-07-15', title: 'US Consumer Price Index (CPI)', description: 'Monthly inflation report.', impact: 'High' },
    
    // GDP
    { type: 'GDP', date: '2026-04-30', title: 'US GDP Q1 (Advance)', description: 'First estimate of US economic growth for Q1 2026.', impact: 'High' },
    { type: 'GDP', date: '2026-05-28', title: 'US GDP Q1 (Second)', description: 'Second revised estimate of US economic growth.', impact: 'Medium' },
    { type: 'GDP', date: '2026-07-30', title: 'US GDP Q2 (Advance)', description: 'First estimate of US economic growth for Q2 2026.', impact: 'High' },
];

export function MarketCalendar() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDetailedInfo = (type: MacroEvent['type']) => {
        switch (type) {
            case 'FED':
                return {
                    importance: "The Federal Reserve's decisions dictate the cost of borrowing and the value of the USD globally.",
                    reaction: "A hawkish (higher rates) stance usually strengthens the USD but pressures equities. A dovish stance is bullish for stocks.",
                    icon: <Scale className="w-12 h-12 text-blue-500/20" />
                };
            case 'ECB':
                return {
                    importance: "The ECB sets the Eurozone monetary policy, influencing European bond markets and EUR/USD parity.",
                    reaction: "European indices (DAX, CAC40) react strongly to rate changes. High rates attract capital into the Euro.",
                    icon: <Landmark className="w-12 h-12 text-blue-600/20" />
                };
            case 'CPI':
                return {
                    importance: "CPI measures the rate of price increases. It's the #1 metric for central banks' inflation target (2%).",
                    reaction: "Higher-than-expected inflation forces banks to raise rates, which is typically bearish for tech stocks.",
                    icon: <Zap className="w-12 h-12 text-amber-500/20" />
                };
            case 'NFP':
                return {
                    importance: "The employment report shows the strength of the economy. High job growth can lead to wage inflation.",
                    reaction: "Strong NFP numbers suggest a robust economy but can signal future rate hikes to cool it down.",
                    icon: <Users className="w-12 h-12 text-emerald-500/20" />
                };
            case 'GDP':
                return {
                    importance: "GDP tracks the total value of all goods and services produced. It represents the pace of economic growth.",
                    reaction: "Rising GDP is fundamentally bullish as it translates to higher corporate earnings and consumer spending.",
                    icon: <Globe className="w-12 h-12 text-purple-500/20" />
                };
        }
    };

    const upcomingEvents = useMemo(() => {
        return ALL_EVENTS
            .filter(e => new Date(e.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 10);
    }, [today]);

    return (
        <Card className="w-full border-white/5 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden group">
            <CardHeader className="border-b border-white/5 pb-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            Global Macro Events
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">Systemic Market Catalysts</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                    {upcomingEvents.map((event, i) => {
                        const eventDate = new Date(event.date);
                        const isToday = isSameDay(eventDate, new Date());
                        const detail = getDetailedInfo(event.type);

                        return (
                            <Dialog key={i}>
                                <DialogTrigger asChild>
                                    <div className={`flex items-start gap-4 p-4 hover:bg-white/5 transition-all relative cursor-pointer border-l-2 border-transparent hover:border-primary/40 ${isToday ? "bg-primary/5 border-primary" : ""}`}>
                                        <div className="flex flex-col items-center justify-center min-w-[50px] py-1">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50">{format(eventDate, "MMM")}</span>
                                            <span className={`text-xl font-black tabular-nums transition-colors ${isToday ? "text-primary" : "text-foreground"}`}>
                                                {format(eventDate, "d")}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`p-1 rounded-md bg-muted/40`}>
                                                    {event.type === 'FED' || event.type === 'ECB' ? <Landmark className="w-3.5 h-3.5 text-blue-500" /> :
                                                    event.type === 'CPI' ? <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> :
                                                    event.type === 'NFP' ? <Users className="w-3.5 h-3.5 text-emerald-500" /> :
                                                    <Activity className="w-3.5 h-3.5 text-purple-500" />}
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{event.type}</span>
                                                {isToday && <span className="text-[9px] font-black uppercase tracking-widest text-primary animate-pulse ml-auto">Happening Today</span>}
                                            </div>
                                            <h4 className="text-sm font-bold tracking-tight text-foreground truncate">{event.title}</h4>
                                            <p className="text-xs text-muted-foreground line-clamp-1 italic mt-0.5">{event.description}</p>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border ${
                                                event.impact === 'High' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            }`}>
                                                {event.impact} Impact
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-md bg-card/95 backdrop-blur-2xl border-white/5 shadow-3xl">
                                    <DialogHeader>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                {event.type === 'FED' || event.type === 'ECB' ? <Landmark className="w-7 h-7" /> :
                                                 event.type === 'CPI' ? <TrendingUp className="w-7 h-7" /> :
                                                 event.type === 'NFP' ? <Users className="w-7 h-7" /> :
                                                 <Activity className="w-7 h-7" />}
                                            </div>
                                            <div>
                                                <DialogTitle className="text-xl font-black tracking-tight">{event.title}</DialogTitle>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-black bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase">{format(eventDate, "MMMM d, yyyy")}</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                                        event.impact === 'High' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'
                                                    }`}>
                                                        {event.impact} Risk
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    <div className="space-y-6 py-4 relative">
                                        <div className="absolute top-0 right-0 pointer-events-none opacity-[0.05] grayscale">
                                            {detail.icon}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Info className="w-3.5 h-3.5" />
                                                Why it matters
                                            </h5>
                                            <p className="text-sm text-foreground/80 font-medium leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                                                {detail.importance}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Activity className="w-3.5 h-3.5" />
                                                Market Reaction
                                            </h5>
                                            <p className="text-sm text-muted-foreground leading-relaxed font-medium italic border-l-2 border-emerald-500/30 pl-4 py-1">
                                                {detail.reaction}
                                            </p>
                                        </div>

                                        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                                            <p className="text-[10px] leading-relaxed text-primary/70 font-bold uppercase tracking-widest text-center">
                                                Professional analysis recommended when trading around this catalyst
                                            </p>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        );
                    })}
                </div>
                <div className="bg-muted/30 p-3 text-center border-t border-white/5">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">
                        All times adjusted to local market hours · source: Global Economic Radar
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
