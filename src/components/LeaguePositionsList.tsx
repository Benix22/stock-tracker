"use client"

import { useState } from "react";
import { executeLeagueTrade } from "@/actions/league-db";
import { formatLeagueNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Position {
    id: string;
    symbol: string;
    shares: number;
    avgPrice: number;
}

interface LeaguePositionsListProps {
    positions: Position[];
    quotesMap: Record<string, number>;
    participantId: string;
}

export function LeaguePositionsList({ positions, quotesMap, participantId }: LeaguePositionsListProps) {
    const [executing, setExecuting] = useState<string | null>(null); // position.id

    const handleSell = async (symbol: string, shares: number, currentPrice: number, positionId: string) => {
        setExecuting(positionId);
        try {
            await executeLeagueTrade({
                participantId,
                symbol,
                shares,
                price: currentPrice,
                type: 'SELL'
            });
            toast.success(`Sold ${shares} shares of ${symbol}`);
        } catch (e: any) {
            toast.error(e.message || "Failed to sell position");
        } finally {
            setExecuting(null);
        }
    };

    if (positions.length === 0) {
        return <div className="text-xs text-zinc-500 italic pl-1">No stocks held yet.</div>;
    }

    return (
        <div className="space-y-3">
            {positions.map(pos => {
                const price = quotesMap[pos.symbol] || pos.avgPrice;
                const value = pos.shares * price;
                const plPct = ((price - pos.avgPrice) / pos.avgPrice) * 100;
                
                return (
                    <div key={pos.id} className="group relative bg-white/[0.015] hover:bg-white/[0.03] transition-colors p-3 rounded-2xl border border-white/5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-xs font-bold text-zinc-200 border border-white/5 group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors">
                                    {pos.symbol.slice(0, 2)}
                                </div>
                                <div>
                                    <div className="text-sm font-black text-white">{pos.symbol}</div>
                                    <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-tighter">
                                        {pos.shares} shares @ <span className="text-white font-black">{formatLeagueNumber(pos.avgPrice, 2, "$")}</span>
                                        <span className="mx-1.5 text-zinc-700 font-black">|</span>
                                        Current @ <span className="text-white font-black">{formatLeagueNumber(price, 2, "$")}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-black text-zinc-100">{formatLeagueNumber(value, 2, "$")}</div>
                                <div className={`text-[10px] font-bold flex items-center justify-end gap-1 ${plPct >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                    {plPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {plPct >= 0 ? "+" : ""}{formatLeagueNumber(plPct, 2)}%
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <SellDialog 
                                symbol={pos.symbol} 
                                maxShares={pos.shares} 
                                currentPrice={price} 
                                onSell={(shares) => handleSell(pos.symbol, shares, price, pos.id)}
                                loading={executing === pos.id}
                            />
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 flex-1 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-500/10"
                                onClick={() => handleSell(pos.symbol, pos.shares, price, pos.id)}
                                disabled={executing !== null}
                            >
                                {executing === pos.id ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Trash2 className="w-3 h-3 mr-2" />}
                                Sell All
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function SellDialog({ symbol, maxShares, currentPrice, onSell, loading }: { 
    symbol: string, 
    maxShares: number, 
    currentPrice: number, 
    onSell: (shares: number) => void,
    loading: boolean
}) {
    const [shares, setShares] = useState(maxShares.toString());
    const [open, setOpen] = useState(false);

    const totalValue = (parseFloat(shares) || 0) * currentPrice;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 flex-1 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06] hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/5"
                >
                    Sell Qty
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0a0a] border-white/10 p-0 overflow-hidden max-w-xs rounded-[2rem]">
                <DialogHeader className="p-6 pb-2 space-y-1 text-left sm:text-left">
                    <DialogTitle className="text-xl font-black tracking-tight text-white">Sell {symbol}</DialogTitle>
                    <DialogDescription className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Available: {maxShares} shares</DialogDescription>
                </DialogHeader>

                <div className="p-6 pt-0 space-y-6">
                    <div className="space-y-3">
                        <div className="relative">
                            <Input 
                                type="number" 
                                value={shares}
                                onChange={e => setShares(e.target.value)}
                                className="h-12 bg-white/5 border-white/10 rounded-xl text-lg font-bold pl-4 pr-12 focus:ring-primary/50 text-white"
                                min="0.01"
                                max={maxShares}
                                step="any"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500 uppercase">Qty</div>
                        </div>
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Est. Credit</span>
                            <span className="text-sm font-black tabular-nums text-emerald-400">{formatLeagueNumber(totalValue, 2, "$")}</span>
                        </div>
                    </div>

                    <Button 
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20"
                        onClick={() => {
                            onSell(parseFloat(shares));
                            setOpen(false);
                        }}
                        disabled={loading || parseFloat(shares) <= 0 || parseFloat(shares) > maxShares}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Sale"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
