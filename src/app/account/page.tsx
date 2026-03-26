"use client"

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Save, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function AccountPage() {
    const { user, isLoaded } = useUser();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [updating, setUpdating] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isLoaded && user) {
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
        }
    }, [isLoaded, user]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || updating) return;

        setUpdating(true);
        setSuccess(false);
        try {
            await user.update({
                firstName,
                lastName
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to update user", error);
        } finally {
            setUpdating(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold">Please sign in to view your account</h1>
                    <Link href="/">
                        <Button>Go Back Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to dashboard
                        </Link>
                        <h1 className="text-4xl font-bold tracking-tight">Account Settings</h1>
                    </div>
                </div>

                <div className="grid gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Personal Information
                            </CardTitle>
                            <CardDescription>
                                Update your name and how you appear to others in the community.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdate} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input 
                                            id="firstName" 
                                            placeholder="Enter your first name" 
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input 
                                            id="lastName" 
                                            placeholder="Enter your last name" 
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input 
                                        readOnly 
                                        disabled
                                        value={user.primaryEmailAddress?.emailAddress || ""}
                                        className="bg-muted/50 border-none text-muted-foreground cursor-not-allowed"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Email changes are managed via secure authentication provider.</p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                        {success && (
                                            <div className="flex items-center gap-2 text-emerald-500 text-sm animate-in fade-in slide-in-from-left-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Profile updated successfully
                                            </div>
                                        )}
                                    </div>
                                    <Button 
                                        type="submit" 
                                        disabled={updating || (firstName === user.firstName && lastName === user.lastName)}
                                        className="gap-2 px-8 rounded-full"
                                    >
                                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-destructive">Advanced Account Controls</h3>
                                    <p className="text-xs text-muted-foreground">To delete your account or change security settings, please use the main security panel.</p>
                                </div>
                                <Button variant="outline" size="sm" className="bg-background text-destructive border-destructive/20 hover:bg-destructive hover:text-white transition-all">
                                    Open Panel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
