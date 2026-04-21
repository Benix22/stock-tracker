"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Loader2, TrendingUp, Bell, Mail, Crown } from "lucide-react";
import { fetchBatchStockCalendar } from "@/actions/stock";
import { CalendarEvent } from "@/lib/stock-api";
import { format } from "date-fns";
import { getUserPlan, getRoadmapAlertsPreference, updateRoadmapAlertsPreference } from "@/actions/subscription";
import { sendRoadmapAlert } from "@/actions/email";
import { toast } from "sonner";

export function PortfolioCalendar({ symbols }: { symbols: string[] }) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [userPlan, setUserPlan] = useState<"FREE" | "PREMIUM">("FREE");
    const [sendingEmail, setSendingEmail] = useState(false);
    const [alertsEnabled, setAlertsEnabled] = useState(false);
    const [togglingAlerts, setTogglingAlerts] = useState(false);

    useEffect(() => {
        const init = async () => {
            const [plan, alerts] = await Promise.all([
                getUserPlan(),
                getRoadmapAlertsPreference()
            ]);
            setUserPlan(plan);
            setAlertsEnabled(alerts);

            if (!symbols || symbols.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const data = await fetchBatchStockCalendar(symbols);
                setEvents(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [symbols.join(',')]);

    const handleToggleAlerts = async () => {
        if (userPlan === "FREE") {
            toast.error("Premium Feature", {
                description: "Daily roadmap alerts are only available for Premium users.",
                action: {
                    label: "Upgrade",
                    onClick: () => window.location.href = "/pricing"
                }
            });
            return;
        }

        const newState = !alertsEnabled;
        setTogglingAlerts(true);
        try {
            await updateRoadmapAlertsPreference(newState);
            setAlertsEnabled(newState);
            toast.success(newState ? "Daily Alerts Activated" : "Alerts Deactivated", {
                description: newState 
                    ? "You will receive an email if an event occurs tomorrow for any of your stocks."
                    : "Automatic roadmap emails have been disabled."
            });
        } catch (e: any) {
            toast.error("Preference update failed");
        } finally {
            setTogglingAlerts(false);
        }
    };

    const handleSendAlert = async () => {
        if (userPlan === "FREE") {
            toast.error("Premium Plan required for email alerts", {
                description: "Upgrade to unlock automatic portfolio roadmap reminders.",
                action: {
                    label: "Upgrade",
                    onClick: () => toast.info("Stripe integration coming soon!")
                }
            });
            return;
        }

        setSendingEmail(true);
        try {
            const result = await sendRoadmapAlert(symbols);
            toast.success("Strategic Alert", {
                description: result.message
            });
        } catch (e: any) {
            toast.error(e.message || "Failed to send alert");
        } finally {
            setSendingEmail(false);
        }
    };

    if (loading && symbols.length > 0) {
        return (
            <Card className="w-full bg-card/50 backdrop-blur-sm border-white/5">
                <CardContent className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
                        Synchronizing Roadmap...
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (events.length === 0) return null;

    return (
        <Card className="w-full border-white/5 bg-gradient-to-b from-card to-background shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-muted/20 pb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-foreground">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                                <CalendarIcon className="w-6 h-6" />
                            </div>
                            Corporate Roadmap
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 font-medium italic">Unified event timeline for your entire portfolio</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Daily Alerts Toggle */}
                        <div className="flex items-center gap-2 p-1.5 bg-zinc-100 rounded-xl border border-white/10 shadow-sm">
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 text-black">Daily Alarms</span>
                            <button
                                onClick={handleToggleAlerts}
                                disabled={togglingAlerts}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${
                                    alertsEnabled ? "bg-emerald-500" : "bg-zinc-300"
                                } ${userPlan === "FREE" ? "opacity-50 grayscale" : ""}`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                                        alertsEnabled ? "translate-x-4.5" : "translate-x-0.5"
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="hidden md:flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                            <Bell className="w-3.5 h-3.5" />
                            {events.length} Upcoming Events
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                    {events.map((event, i) => (
                        <div key={i} className="group flex items-center gap-6 p-6 hover:bg-white/[0.02] transition-colors relative">
                            {/* Date Column */}
                            <div className="flex flex-col items-center justify-center min-w-[70px] text-center border-r border-white/5 pr-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 leading-tight">
                                    {format(new Date(event.date), "MMM")}
                                </span>
                                <span className="text-3xl font-black tabular-nums tracking-tighter leading-none py-1 text-foreground">
                                    {format(new Date(event.date), "d")}
                                </span>
                                <span className="text-[10px] font-bold text-primary tracking-tight">
                                    {format(new Date(event.date), "yyyy")}
                                </span>
                            </div>

                            {/* Content Column */}
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                                        {event.symbol}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${
                                        event.type === 'Earnings' ? 'bg-amber-500/10 text-amber-500' :
                                        event.type === 'Dividend' ? 'bg-emerald-500/10 text-emerald-500' :
                                        'bg-blue-500/10 text-blue-500'
                                    }`}>
                                        {event.type}
                                    </span>
                                </div>
                                <h4 className="text-base font-bold tracking-tight text-foreground">{event.title}</h4>
                                {event.description && (
                                    <p className="text-xs text-muted-foreground font-medium italic truncate max-w-md">
                                        {event.description}
                                    </p>
                                )}
                            </div>

                            {/* Action / Icon */}
                            <div className="opacity-10 group-hover:opacity-100 transition-opacity pr-4">
                                <TrendingUp className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
