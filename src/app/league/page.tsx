import { auth } from "@clerk/nextjs/server";
import { getLeagueParticipant, getLeagueLeaderboard, joinLeague } from "@/actions/league-db";
import { redirect } from "next/navigation";
import { Trophy, Users, Timer, Target, TrendingUp, Sparkles, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeagueLeaderboard } from "@/components/LeagueLeaderboard";
import { ClientLeagueAction } from "@/components/ClientLeagueAction";

export default async function LeaguePage() {
  const { userId } = await auth();
  // Protection handled by middleware

    const participant = await getLeagueParticipant();
    const rawLeaderboard = await getLeagueLeaderboard();

    // Calculate user rank
    const userRank = participant ? rawLeaderboard.findIndex(p => p.id === participant.id) + 1 : null;
    const userTotalValue = participant ? rawLeaderboard.find(p => p.id === participant.id)?.totalValue ?? participant.cashBalance : 0;
    const userPL = userTotalValue - 100000;
    const userPLPct = (userPL / 100000) * 100;

    // Fetch user positions
    const { getLeaguePositions } = await import("@/actions/league-db");
    const { getBatchStockQuotes } = await import("@/actions/stock");
    const userPositions = participant ? await getLeaguePositions(participant.id) : [];
    const symbols = userPositions.map(p => p.symbol);
    const quotes = symbols.length > 0 ? await getBatchStockQuotes(symbols) : [];
    const quotesMap = Object.fromEntries(quotes.map(q => [q.symbol, q.price]));

    // Calculate days remaining in month
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysRemaining = Math.max(0, lastDay.getDate() - now.getDate());

    return (
        <div className="min-h-screen bg-[#030303] text-white p-4 md:p-8 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-transparent border border-white/10 p-8 md:p-12 shadow-2xl">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 pointer-events-none">
                        <Trophy className="w-64 h-64" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-4 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em]">
                                <Sparkles className="w-4 h-4" />
                                March 2026 Season
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                                TRADERS <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">LEAGUE</span>
                            </h1>
                            <p className="text-white/70 text-lg max-w-xl font-medium">
                                Start with $100,000. Compete as the top performer. Win the monthly crown.
                            </p>
                        </div>

                        <div className="flex flex-col items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-inner min-w-[240px]">
                            <Timer className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] mb-2" />
                            <div className="text-4xl font-black tabular-nums text-white">{daysRemaining}</div>
                            <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-400">Days Remaining</div>
                        </div>
                    </div>
                </div>

                {!participant ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-in slide-in-from-bottom-8 duration-1000">
                        <div className="text-center space-y-6 max-w-md">
                            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                                <Target className="w-12 h-12 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">Ready to compete?</h2>
                            <p className="text-muted-foreground">Enter the arena with $100,000 in virtual capital. Your actual portfolio won't be affected.</p>
                            <ClientLeagueAction />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-1000">
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="bg-card/20 border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                        <LayoutDashboard className="w-4 h-4" />
                                        Your Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <div className="text-xs font-bold text-zinc-400 uppercase mb-1">Total Equity</div>
                                        <div className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">
                                            ${new Intl.NumberFormat().format(userTotalValue)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Current P&L</div>
                                            <div className={`text-xl font-black ${userPL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                {userPL >= 0 ? "+" : ""}{new Intl.NumberFormat().format(userPL)}
                                            </div>
                                            <div className={`text-[10px] font-bold ${userPL >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                {userPL >= 0 ? "+" : ""}{userPLPct.toFixed(2)}%
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Ranking</div>
                                            <div className="text-xl font-black text-primary">#{userRank || "--"}</div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter opacity-60">Top {((userRank || 1) / Math.max(rawLeaderboard.length, 1) * 100).toFixed(0)}%</div>
                                        </div>
                                    </div>

                                    {/* Mini Positions View */}
                                    <div className="space-y-3 pt-4 border-t border-white/5">
                                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Open Positions</div>
                                        {userPositions.length === 0 ? (
                                            <div className="text-xs text-zinc-500 italic pl-1">No stocks held yet.</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {userPositions.map(pos => {
                                                    const price = quotesMap[pos.symbol] || pos.avgPrice;
                                                    const value = pos.shares * price;
                                                    const plPct = ((price - pos.avgPrice) / pos.avgPrice) * 100;
                                                    return (
                                                        <div key={pos.id} className="flex items-center justify-between bg-white/[0.015] p-3 rounded-xl border border-white/5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-[10px] font-bold text-zinc-200">{pos.symbol.slice(0, 2)}</div>
                                                                <div>
                                                                    <div className="text-xs font-bold text-white">{pos.symbol}</div>
                                                                    <div className="text-[10px] text-zinc-400">{pos.shares} shares</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs font-bold text-zinc-200">${new Intl.NumberFormat().format(value)}</div>
                                                                <div className={`text-[9px] font-bold ${plPct >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                                    {plPct >= 0 ? "+" : ""}{plPct.toFixed(2)}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary/20 to-indigo-900/20 border border-primary/20">
                                <h3 className="text-lg font-black tracking-tight mb-2 text-white">League Rules</h3>
                                <ul className="text-sm space-y-3 text-zinc-300 font-medium">
                                    <li className="flex items-start gap-2">
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary shrink-0">1</div>
                                        Reset occurs on the 1st of every month.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary shrink-0">2</div>
                                        Starting balance is $100,000 for everyone.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary shrink-0">3</div>
                                        Real-time prices from Alpaca for all trades.
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Leaderboard */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 text-white">
                                    <Users className="w-6 h-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                                    Leaderboard
                                </h2>
                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                    TOP performing traders
                                </div>
                            </div>
                            <LeagueLeaderboard participants={JSON.parse(JSON.stringify(rawLeaderboard))} />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
