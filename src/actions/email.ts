"use server"

import { auth, currentUser } from "@clerk/nextjs/server";
import { isPremium } from "./subscription";

/**
 * Sends a roadmap alert email to the current user.
 * This is a PREMIUM feature.
 */
export async function sendRoadmapAlert(symbols: string[]) {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authenticated");

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;

    if (!email) throw new Error("No email address found for user");

    // Check plan
    const hasPremium = await isPremium();
    if (!hasPremium) {
        throw new Error("PREMIUM_REQUIRED");
    }

    // In a real app, you would:
    // 1. Fetch upcoming events for the given symbols from an API (Yahoo Finance/Alpaca)
    // 2. Format a nice HTML email using a template
    // 3. Send it via Resend, SendGrid, etc.

    console.log(`[MOCK EMAIL] Sending Roadmap Alert to ${email} for symbols: ${symbols.join(", ")}`);
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 1500));

    return { 
        success: true, 
        message: `Strategic alert sent to ${email}. You will receive it in a few minutes.` 
    };
}

/**
 * Broadcasts a new season announcement to all users.
 * ADMIN ONLY (Implementation placeholder)
 */
export async function broadcastNewSeason() {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authenticated");

    try {
        console.log("[ADMIN] Broadcasting new season announcement...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Sends a test email to the current administrator.
 */
export async function sendTestEmail() {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    
    if (!email) throw new Error("No email found");

    try {
        console.log(`[ADMIN] Sending test email to ${email}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
