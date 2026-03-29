"use client"

import { useState, useEffect } from "react";
import { executeLeagueTrade, getLeagueParticipant } from "@/actions/league-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { Trophy, Wallet, ShoppingCart, Loader2, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function LeagueTradeWidget({ symbol, currentPrice }: { symbol: string, currentPrice: number }) {
    const [participant, setParticipant] = useState<any>(null);
    const [shares, setShares] = useState("1");
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const fetchParticipant = async () => {
            const p = await getLeagueParticipant();
            setParticipant(p);
            setLoading(false);
        };
        fetchParticipant();
    }, []);

    const handleTrade = async (type: 'BUY' | 'SELL') => {
        if (!participant) return;
        setExecuting(true);
        setError(null);
        try {
            await executeLeagueTrade({
                participantId: participant.id,
                symbol,
                shares: parseFloat(shares),
                price: currentPrice,
                type
            });
            setOpen(false);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setExecuting(false);
        }
    };

    if (loading) return null;
    if (!participant) return null; // Only show if user is in league

    const totalCost = parseFloat(shares) * currentPrice;
    const canAfford = participant.cashBalance >= totalCost;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="h-8 gap-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">
                    <Trophy className="w-3.5 h-3.5" />
                    League Trade
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0a0a] border-white/10 p-0 overflow-hidden max-w-sm rounded-[2rem]">
                <div className="bg-gradient-to-br from-amber-500/20 to-transparent p-6 pb-2">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                             <Trophy className="w-5 h-5 text-amber-500" />
                             <span className="text-[10px] uppercase font-black tracking-widest text-amber-500/80">March Season Trade</span>
                        </div>
                        <DialogTitle className="text-2xl font-black tracking-tight">{symbol}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex items-center justify-between mt-6 bg-white/5 rounded-2xl p-4 border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">League Cash</span>
                            <span className="text-lg font-black tabular-nums">${new Intl.NumberFormat().format(participant.cashBalance)}</span>
                        </div>
                        <Wallet className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Shares to execute</label>
                        <div className="relative group">
                            <Input 
                                type="number" 
                                value={shares}
                                onChange={e => setShares(e.target.value)}
                                className="h-14 bg-white/5 border-white/10 rounded-2xl text-xl font-bold pl-4 focus:ring-amber-500/50 text-white"
                                min="0.01"
                                step="any"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground uppercase opacity-40">Qty</div>
                        </div>
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs text-muted-foreground font-medium">Estimated cost</span>
                            <span className="text-sm font-black tabular-nums text-white">${new Intl.NumberFormat().format(totalCost)}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-xs font-bold animate-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Button 
                            variant="outline" 
                            className="h-14 rounded-2xl border-white/10 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 font-black text-xs uppercase tracking-widest"
                            onClick={() => handleTrade('SELL')}
                            disabled={executing}
                        >
                            Sell Position
                        </Button>
                        <Button 
                            className={`h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all ${
                                !canAfford ? 'bg-muted cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-primary/20 hover:scale-[1.02]'
                            }`}
                            onClick={() => handleTrade('BUY')}
                            disabled={executing || !canAfford}
                        >
                            {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Buy"}
                        </Button>
                    </div>
                    
                    {!canAfford && (
                        <p className="text-[10px] text-center text-rose-400/60 font-medium uppercase tracking-tighter">Insufficient league funds for this quantity</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
