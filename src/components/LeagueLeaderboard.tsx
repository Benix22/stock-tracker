"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, DollarSign, Wallet } from "lucide-react";
import { formatLeagueNumber } from "@/lib/utils";

interface Participant {
    id: string;
    userId: string;
    userFullName: string | null;
    userImageUrl: string | null;
    cashBalance: number;
    totalValue: number;
    profitPct: number;
    joinedAt: string;
}

export function LeagueLeaderboard({ participants }: { participants: Participant[] }) {
    if (!participants || participants.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed rounded-[2rem] text-zinc-500 italic">
                No traders have joined this season yet. Be the first to enter!
            </div>
        );
    }

    return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-primary/20">
            {participants.map((p, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                
                return (
                    <Card 
                        key={p.id} 
                        className={`group relative overflow-hidden transition-all duration-300 hover:bg-white/10 active:scale-[0.99] rounded-3xl border-white/5 shadow-lg ${
                            isTop3 ? "bg-gradient-to-r from-primary/10 to-transparent border-primary/20" : "bg-white/[0.03]"
                        }`}
                    >
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                {/* Ranking Badge */}
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl font-black text-xl tabular-nums shadow-inner transition-transform group-hover:scale-110 ${
                                    rank === 1 ? "bg-amber-500 text-black shadow-amber-500/50" :
                                    rank === 2 ? "bg-slate-300 text-black shadow-slate-300/50" :
                                    rank === 3 ? "bg-amber-700 text-white shadow-amber-700/50" :
                                    "bg-white/10 text-zinc-400"
                                }`}>
                                    {rank === 1 ? <Trophy className="w-6 h-6" /> : rank}
                                </div>

                                {/* User Info */}
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-white/10 shadow-lg group-hover:border-primary/50 transition-colors">
                                        <AvatarImage src={p.userImageUrl || ""} />
                                        <AvatarFallback className="bg-muted text-xs font-black uppercase tracking-widest text-zinc-400">
                                            {p.userFullName?.slice(0, 2) || "TR"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-black text-lg tracking-tight text-white">
                                            {p.userFullName || "Anonymous Trader"}
                                        </div>
                                        <div className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5 mt-0.5">
                                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                                            Active this season
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Portfolio Value */}
                            <div className="flex flex-col items-end gap-1.5">
                                <div className="text-sm font-bold text-zinc-400 uppercase flex items-center gap-1.5 opacity-60">
                                    <Wallet className="w-3.5 h-3.5" />
                                    Total Value
                                </div>
                                <div className="text-2xl font-black tabular-nums tracking-tighter text-white">
                                    {formatLeagueNumber(p.totalValue || p.cashBalance, 2, "$")}
                                </div>
                                <Badge variant="secondary" className={`${p.profitPct >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"} text-[10px] font-black border-none uppercase px-3 py-1`}>
                                    {p.profitPct >= 0 ? "+" : ""}{formatLeagueNumber(p.profitPct, 2)}%
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
