"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Users, Mail, AlertTriangle, CheckCircle, Loader2, Monitor, Smartphone, MessageSquare } from "lucide-react";
import { broadcastNewSeason, sendTestEmail } from "@/actions/email";

interface Props {
    userCount: number;
}

export function AdminEmailClient({ userCount }: Props) {
    const [sending, setSending] = useState(false);
    const [testing, setTesting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [testSuccess, setTestSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

    const handleBroadcast = async () => {
        const confirmMsg = userCount > 0 
            ? `Are you sure you want to broadcast this email to ${userCount} users?` 
            : "No users found in Clerk. Broadcast anyway?";
            
        if (!confirm(confirmMsg)) return;

        setSending(true);
        setError(null);
        
        try {
            const result = await broadcastNewSeason();
            if (result.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 5000);
            } else {
                setError(result.error as string);
            }
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred during broadcast.");
        } finally {
            setSending(false);
        }
    };

    const handleTestSend = async () => {
        setTesting(true);
        setError(null);
        setTestSuccess(false);
        
        try {
            const result = await sendTestEmail();
            if (result.success) {
                setTestSuccess(true);
                setTimeout(() => setTestSuccess(false), 5000);
            } else {
                setError(result.error as string);
            }
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred during test send.");
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#080808] p-8 pt-24 text-white">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <Send className="w-8 h-8 text-primary" />
                            Email Broadcast
                        </h1>
                        <p className="text-muted-foreground mt-1">League Announcements & New Season Notifications</p>
                        
                        {error && (
                            <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-500 max-w-2xl">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <div className="text-sm font-bold uppercase tracking-widest">Resend Restriction Error</div>
                                    <p className="text-xs opacity-80 leading-relaxed">
                                        {error.includes("testing email address") 
                                            ? "Your Resend account is in 'Testing Mode'. You can only send to your own email address. To send to all users, you must verify your domain in the Resend Dashboard."
                                            : error}
                                    </p>
                                </div>
                            </div>
                        )}
                        {testSuccess && (
                            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-500">
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                <div className="text-sm font-bold uppercase tracking-widest">Test Email Sent!</div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="lg"
                            className="rounded-xl font-bold px-6 border-white/10 hover:bg-white/5 text-white transition-all active:scale-95"
                            onClick={handleTestSend}
                            disabled={testing || sending}
                        >
                            {testing ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending Test...</>
                            ) : (
                                <><MessageSquare className="w-4 h-4 mr-2" /> Send Test to Me</>
                            )}
                        </Button>
                        <Button
                            variant="default"
                            size="lg"
                            className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 group"
                            onClick={handleBroadcast}
                            disabled={sending || testing || success || userCount === 0}
                        >
                            {sending ? (
                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Broadcasting...</>
                            ) : success ? (
                                <><CheckCircle className="w-5 h-5 mr-2" /> Broadcast Complete</>
                            ) : (
                                <><Mail className="w-5 h-5 mr-2 group-hover:animate-bounce" /> Broadcast to {userCount.toLocaleString()} Users</>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Stats & Config */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="bg-card/20 border-white/5 shadow-inner">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stats Dashboard</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Target Audience</div>
                                    <div className="text-2xl font-black text-white flex items-center gap-2">
                                        <Users className="w-5 h-5 text-primary" />
                                        {userCount.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-emerald-500 font-bold mt-1">Verified Clerk Users</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">League Meta</div>
                                    <div className="text-xl font-black text-white uppercase tracking-tight">APRIL 2026</div>
                                    <div className="text-[10px] text-amber-500 font-bold mt-1">Day 1 Starts Tomorrow</div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 shadow-inner">
                            <div className="flex items-center gap-2 text-amber-500">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-xs font-black uppercase tracking-wider">Testing Mode info</span>
                            </div>
                            <p className="text-xs text-amber-500/80 font-medium leading-relaxed">
                                Resend restricts free accounts to verified domains. To bypass this for testing, ensure the users in Clerk match your verified Resend emails.
                            </p>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex items-center justify-between bg-white/[0.03] p-2 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2 px-3">
                                <div className="w-2 h-2 rounded-full bg-rose-500/50 shadow-lg shadow-rose-500/20"></div>
                                <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
                                <span className="text-[10px] font-bold text-muted-foreground/40 ml-2 uppercase tracking-[0.2em]">Preview Engine</span>
                            </div>
                            <div className="flex p-1 bg-black/40 rounded-xl">
                                <Button 
                                    variant={previewMode === "desktop" ? "secondary" : "ghost"} 
                                    size="sm" 
                                    className="h-8 rounded-lg px-3"
                                    onClick={() => setPreviewMode("desktop")}
                                >
                                    <Monitor className="w-4 h-4 mr-2" />
                                    Desktop
                                </Button>
                                <Button 
                                    variant={previewMode === "mobile" ? "secondary" : "ghost"} 
                                    size="sm" 
                                    className="h-8 rounded-lg px-3"
                                    onClick={() => setPreviewMode("mobile")}
                                >
                                    <Smartphone className="w-4 h-4 mr-2" />
                                    Mobile
                                </Button>
                            </div>
                        </div>

                        <div className={`mx-auto bg-white rounded-[2rem] overflow-hidden shadow-3xl transition-all duration-700 ${previewMode === "mobile" ? "max-w-[400px] border-[12px] border-zinc-900 ring-4 ring-zinc-800" : "w-full border border-white/5"}`}>
                            <iframe 
                                src="/email.html" 
                                className="w-full h-[750px] border-none"
                                title="Email Template Preview"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
