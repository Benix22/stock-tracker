"use client"

import { useState, useEffect, useCallback } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { getCommentsBySymbol, addComment, deleteComment } from "@/actions/comments-db";
import { getCommunitySummary } from "@/actions/comments-ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, ThumbsUp, ThumbsDown, Trash2, Loader2, User, Send, ShieldCheck, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

    const fetchComments = useCallback(async () => {
        try {
            const data = await getCommentsBySymbol(symbol);
            setComments(data as any);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    useEffect(() => {
        if (comments.length >= 2) {
            getCommunitySummary(symbol).then(setAiSummary);
        } else {
            setAiSummary(null);
        }
    }, [symbol, comments.length]);

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

    const bullishCount = comments.filter(c => c.sentiment === "BULLISH").length;
    const bearishCount = comments.filter(c => c.sentiment === "BEARISH").length;
    const totalSentiment = bullishCount + bearishCount;
    const bullishPct = totalSentiment > 0 ? (bullishCount / totalSentiment) * 100 : 50;

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
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
                {/* AI Summary */}
                {aiSummary && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3 text-sm leading-relaxed backdrop-blur-sm shadow-inner group transition-all duration-500 hover:bg-primary/10">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        </div>
                        <p className="text-foreground/80 italic font-medium">
                            <span className="font-bold text-primary not-italic">Community Pulse: </span>
                            {aiSummary}
                        </p>
                    </div>
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
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSentiment("BULLISH")}
                                        className={`gap-2 rounded-full ${sentiment === "BULLISH" ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "text-muted-foreground"}`}
                                    >
                                        <ThumbsUp className="w-4 h-4" />
                                        Bullish
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSentiment("BEARISH")}
                                        className={`gap-2 rounded-full ${sentiment === "BEARISH" ? "bg-rose-500/10 border-rose-500 text-rose-500" : "text-muted-foreground"}`}
                                    >
                                        <ThumbsDown className="w-4 h-4" />
                                        Bearish
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSentiment("NEUTRAL")}
                                        className={`gap-2 rounded-full ${sentiment === "NEUTRAL" ? "bg-primary/10 border-primary text-primary" : "text-muted-foreground"}`}
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
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-foreground">{comment.userFullName}</span>
                                            {comment.isHolder && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary uppercase tracking-tighter shadow-sm">
                                                    <ShieldCheck className="w-2.5 h-2.5" />
                                                    Verified Holder
                                                </span>
                                            )}
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase px-2 py-0.5 bg-muted rounded-full">
                                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                            </span>
                                            {comment.sentiment !== "NEUTRAL" && (
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shadow-sm
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
