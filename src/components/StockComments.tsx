"use client"

import { useState, useEffect, useCallback } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { getCommentsBySymbol, addComment, deleteComment } from "@/actions/comments-db";
import { getCommunitySummary } from "@/actions/comments-ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, ThumbsUp, ThumbsDown, Trash2, Loader2, User, Send, ShieldCheck, Sparkles, Crown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getUserPlan } from "@/actions/subscription";
import { toast } from "sonner";

interface Comment {
    id: string;
    userId: string;
    userFullName: string | null;
    userImageUrl: string | null;
    symbol: string;
    content: string;
    sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
    createdAt: string | Date;
    isHolder: boolean;
}

export function StockComments({ symbol }: { symbol: string }) {
    const { user } = useUser();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [content, setContent] = useState("");
    const [sentiment, setSentiment] = useState<"BULLISH" | "BEARISH" | "NEUTRAL">("NEUTRAL");
    const [submitting, setSubmitting] = useState(false);
    const [userPlan, setUserPlan] = useState<"FREE" | "PREMIUM">("FREE");
    const [planLoading, setPlanLoading] = useState(true);

    const fetchComments = useCallback(async () => {
        try {
            const [data, plan] = await Promise.all([
                getCommentsBySymbol(symbol),
                getUserPlan()
            ]);
            setComments(data as any);
            setUserPlan(plan);
        } catch (error) {
            console.error("Failed to fetch comments and plan", error);
        } finally {
            setLoading(false);
            setPlanLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    useEffect(() => {
        if (comments.length >= 2 && userPlan === "PREMIUM") {
            getCommunitySummary(symbol).then(setAiSummary);
        } else {
            setAiSummary(null);
        }
    }, [symbol, comments.length, userPlan]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || submitting || !user) return;

        setSubmitting(true);
        try {
            await addComment({
                symbol,
                content: content.trim(),
                sentiment
            });
            setContent("");
            setSentiment("NEUTRAL");
            await fetchComments();
        } catch (error) {
            console.error("Failed to post comment", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setComments(prev => prev.filter(c => c.id !== id));
            await deleteComment(id);
        } catch (error) {
            await fetchComments();
        }
    };

    let bullishCount = 0;
    let bearishCount = 0;
    const userSentiments = new Set<string>();

    for (const comment of comments) {
        if (!userSentiments.has(comment.userId)) {
            userSentiments.add(comment.userId);
            if (comment.sentiment === "BULLISH") bullishCount++;
            if (comment.sentiment === "BEARISH") bearishCount++;
        }
    }

    const totalSentiment = bullishCount + bearishCount;
    const bullishPct = totalSentiment > 0 ? (bullishCount / totalSentiment) * 100 : 50;

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Community Thoughts
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Share your analysis and sentiment on {symbol}</p>
                </div>
                {totalSentiment > 0 && (
                    <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-emerald-500">Bullish {Math.round(bullishPct)}%</span>
                            <span className="text-rose-500">{Math.round(100 - bullishPct)}% Bearish</span>
                        </div>
                        <div className="w-full h-1.5 bg-rose-500/20 rounded-full overflow-hidden flex">
                            <div 
                                className="h-full bg-emerald-500 transition-all duration-500" 
                                style={{ width: `${bullishPct}%` }}
                            />
                        </div>
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Community Pulse (AI Summary) */}
                {comments.length >= 2 && (
                    userPlan === "PREMIUM" ? (
                        aiSummary && (
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3 text-sm leading-relaxed backdrop-blur-sm shadow-inner group transition-all duration-500 hover:bg-primary/10">
                                <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                </div>
                                <p className="text-foreground/80 italic font-medium">
                                    <span className="font-bold text-primary not-italic">Community Pulse: </span>
                                    {aiSummary}
                                </p>
                            </div>
                        )
                    ) : (
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-between gap-4 backdrop-blur-sm group transition-all duration-500 overflow-hidden relative min-h-[72px]">
                            <div className="flex gap-3 items-center relative z-10">
                                <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <Crown className="w-4 h-4 text-amber-500" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">Community Pulse</span>
                                        <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1 py-0.5 rounded uppercase font-bold">Premium</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground font-medium">Unlock AI-powered summary of the community sentiment.</p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="relative z-10 h-8 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-lg px-4 border border-amber-500/10"
                                onClick={() => toast.info("Stripe integration coming soon! Use the Navbar badge to toggle for now.")}
                            >
                                Upgrade
                            </Button>
                            {/* Faded background text simulation to entice the user */}
                            <div className="absolute left-[30%] right-[20%] top-0 bottom-0 opacity-[0.03] select-none pointer-events-none blur-[2px] flex items-center gap-2">
                                <div className="w-full h-3 bg-white/20 rounded-full" />
                                <div className="w-1/2 h-3 bg-white/20 rounded-full" />
                            </div>
                        </div>
                    )
                )}

                {/* Post Form */}
                <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border">
                    {user ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Textarea
                                placeholder={`What's your take on ${symbol}?`}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="bg-background border-none focus-visible:ring-1 focus-visible:ring-primary/50 resize-none min-h-[100px]"
                                maxLength={500}
                            />
                            <div className="flex items-center justify-between">
                                <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSentiment("BULLISH")}
                                        className={`gap-1.5 md:gap-2 rounded-full h-8 px-2 md:px-3 text-[10px] md:text-sm ${sentiment === "BULLISH" ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "text-muted-foreground"}`}
                                    >
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                        Bullish
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSentiment("BEARISH")}
                                        className={`gap-1.5 md:gap-2 rounded-full h-8 px-2 md:px-3 text-[10px] md:text-sm ${sentiment === "BEARISH" ? "bg-rose-500/10 border-rose-500 text-rose-500" : "text-muted-foreground"}`}
                                    >
                                        <ThumbsDown className="w-3.5 h-3.5" />
                                        Bearish
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSentiment("NEUTRAL")}
                                        className={`gap-1.5 md:gap-2 rounded-full h-8 px-2 md:px-3 text-[10px] md:text-sm ${sentiment === "NEUTRAL" ? "bg-primary/10 border-primary text-primary" : "text-muted-foreground"}`}
                                    >
                                        Neutral
                                    </Button>
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={!content.trim() || submitting}
                                    className="gap-2 px-6"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Post
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="py-4 text-center space-y-3">
                            <p className="text-sm text-muted-foreground font-medium">Join the community to share your analysis</p>
                            <SignInButton mode="modal">
                                <Button variant="outline" className="rounded-full px-8">Sign In to Comment</Button>
                            </SignInButton>
                        </div>
                    )}
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
                        </div>
                    ) : comments.length > 0 ? (
                        comments.map((comment) => (
                            <div key={comment.id} className="group flex gap-4 p-4 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                                <div className="shrink-0">
                                    {comment.userImageUrl ? (
                                        <img src={comment.userImageUrl} alt="" className="w-10 h-10 rounded-full bg-muted object-cover border" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                            <User className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-start justify-between">
                                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                                            <span className="font-bold text-sm text-foreground truncate">{comment.userFullName}</span>
                                            {comment.isHolder && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary uppercase tracking-tighter shadow-sm shrink-0">
                                                    <ShieldCheck className="w-2.5 h-2.5" />
                                                    Verified Holder
                                                </span>
                                            )}
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase px-2 py-0.5 bg-muted rounded-full shrink-0">
                                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                            </span>
                                            {comment.sentiment !== "NEUTRAL" && (
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shadow-sm shrink-0
                                                    ${comment.sentiment === "BULLISH" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                                                    {comment.sentiment}
                                                </span>
                                            )}
                                        </div>
                                        {user?.id === comment.userId && (
                                            <button 
                                                onClick={() => handleDelete(comment.id)}
                                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                        {comment.content}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
