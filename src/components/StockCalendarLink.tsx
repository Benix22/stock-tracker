"use client"

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Loader2, CalendarDays, Sparkles } from "lucide-react";
import { fetchStockCalendar, fetchAIStockEvents } from "@/actions/stock";
import { CalendarEvent } from "@/lib/stock-api";
import { format } from "date-fns";

export function StockCalendarLink({ symbol }: { symbol: string }) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const loadCalendar = async () => {
        setLoading(true);
        try {
            const [calendarData, aiData] = await Promise.all([
                fetchStockCalendar(symbol),
                fetchAIStockEvents(symbol).catch(() => []) // Fallback in case Gemini fails/quota
            ]);
            
            // Merge and dedup
            const allEvents = [...calendarData, ...aiData];
            const unique = allEvents.filter((ev, index, self) =>
                index === self.findIndex((t) => (
                    t.title === ev.title && 
                    new Date(t.date).toDateString() === new Date(ev.date).toDateString()
                ))
            );
            
            setEvents(unique.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v);
            if (v && events.length === 0) loadCalendar();
        }}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-primary hover:text-white hover:bg-primary border border-primary/30 bg-primary/5 px-2 md:px-3 py-1 rounded-full transition-all duration-300">
                    <CalendarDays className="w-3 md:w-3.5 h-3 md:h-3.5" />
                    CALENDAR
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl font-black tracking-tight">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        Financial Calendar
                        <span className="text-xs font-bold text-muted-foreground/60 ml-auto mr-4 tracking-widest">{symbol}</span>
                    </DialogTitle>
                </DialogHeader>
                
                <div className="py-6 space-y-6 max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-primary/20">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="relative">
                                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                                <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-primary animate-pulse" />
                            </div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Deep Scanning news & filings...</p>
                        </div>
                    ) : events.length > 0 ? (
                        <div className="space-y-6">
                            {events.map((event, i) => (
                                <div key={i} className="group relative pl-8 border-l border-white/10 pb-2 last:pb-0 transition-all hover:border-primary/40">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-background border border-muted-foreground/30 group-hover:border-primary group-hover:bg-primary transition-all shadow-[0_0_10px_rgba(37,99,235,0)] group-hover:shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${
                                                event.type === 'Earnings' ? 'bg-amber-500/10 text-amber-500' :
                                                event.type === 'Dividend' ? 'bg-emerald-500/10 text-emerald-500' :
                                                'bg-blue-500/10 text-blue-500'
                                            }`}>
                                                {event.type}
                                            </span>
                                            <span className="text-[10px] font-black text-muted-foreground/50 border border-white/5 bg-white/5 px-2 py-0.5 rounded uppercase">
                                                {format(new Date(event.date), "MMM d, yyyy")}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold tracking-tight group-hover:text-primary transition-colors">{event.title}</h4>
                                            {event.description && (
                                                <p className="text-sm text-muted-foreground leading-relaxed mt-1 font-medium italic">
                                                    {event.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto opacity-40">
                                <CalendarIcon className="w-8 h-8" />
                            </div>
                            <p className="text-sm text-muted-foreground font-semibold italic">
                                No upcoming corporate events detected.
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">
                        Dates are estimated and subject to change by the issuer
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
