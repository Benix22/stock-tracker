"use client"

import { useState } from "react";
import { joinLeague } from "@/actions/league-db";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export function ClientLeagueAction() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleJoin = async () => {
        setLoading(true);
        try {
            await joinLeague();
            router.refresh();
        } catch (error) {
            console.error("Failed to join league", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button 
            onClick={handleJoin} 
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-black tracking-tight gap-3 shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
                    <Zap className="w-5 h-5 fill-current" />
                    JOIN THE COMPETITION
                </>
            )}
        </Button>
    );
}
