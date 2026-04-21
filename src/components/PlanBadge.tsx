"use client"

import { useState, useEffect } from "react";
import { getUserPlan, updateUserPlan, Plan } from "@/actions/subscription";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PlanBadge() {
    const [plan, setPlan] = useState<Plan>("FREE");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const p = await getUserPlan();
                setPlan(p);
            } catch (e) {
                console.error("Failed to fetch plan", e);
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, []);

    const togglePlan = async () => {
        setUpdating(true);
        const newPlan = plan === "FREE" ? "PREMIUM" : "FREE";
        try {
            await updateUserPlan(newPlan);
            setPlan(newPlan);
            toast.success(`Switched to ${newPlan} plan (DEV MODE)`);
        } catch (e: any) {
            toast.error(e.message || "Failed to update plan");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="w-16 h-6 bg-white/5 animate-pulse rounded-full" />;

    return (
        <button 
            onClick={togglePlan} 
            disabled={updating}
            className="focus:outline-none transition-transform hover:scale-105 active:scale-95"
            title="Click to toggle plan (DEV ONLY)"
        >
            <Badge 
                variant={plan === "PREMIUM" ? "default" : "secondary"}
                className={`gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border transition-all ${
                    plan === "PREMIUM" 
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                        : "bg-white/5 text-zinc-400 border-white/10"
                }`}
            >
                {updating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                ) : plan === "PREMIUM" ? (
                    <>
                        <Crown className="w-3 h-3" />
                        Premium
                    </>
                ) : (
                    <>
                        <Sparkles className="w-3 h-3" />
                        Free
                    </>
                )}
            </Badge>
        </button>
    );
}
