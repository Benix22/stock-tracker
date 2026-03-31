"use server"

import { Resend } from 'resend';
import { clerkClient, currentUser } from '@clerk/nextjs/server';
import fs from 'fs';
import path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a test email to the currently logged-in administrator.
 * Useful for bypassing Resend's "Testing Mode" restrictions.
 */
export async function sendTestEmail() {
    try {
        const user = await currentUser();
        if (!user) return { success: false, error: "Not authenticated" };

        const emailAddress = user.emailAddresses[0]?.emailAddress;
        if (!emailAddress) return { success: false, error: "Admin has no email address" };

        // Read the HTML template
        const templatePath = path.join(process.cwd(), 'public', 'email.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        const { data, error } = await resend.emails.send({
            from: 'Traders League <onboarding@resend.dev>',
            to: emailAddress,
            subject: '🧪 TEST: Traders League Season Launch',
            html: htmlContent.replace('[[LEAGUE_URL]]', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/league`),
        });

        if (error) return { success: false, error: error.message };
        return { success: true, email: emailAddress, data };

    } catch (error: any) {
        console.error("Test send failed:", error);
        return { success: false, error: error.message || "Internal server error" };
    }
}

/**
 * Broadcasts the New Season Announcement to all registered users via Clerk & Resend.
 */
export async function broadcastNewSeason() {
    try {
        const client = await clerkClient();
        
        // 1. Fetch all users from Clerk (pagination if necessary, here simple fetch)
        const { data: users } = await client.users.getUserList({
            limit: 500, // Adjust based on your user base
        });

        if (!users || users.length === 0) {
            return { success: false, error: "No users found in Clerk." };
        }

        // 2. Read the HTML template from public folder
        const templatePath = path.join(process.cwd(), 'public', 'email.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        // 3. Prepare the emails (Resend batch is efficient)
        // Note: In Resend free/test mode, you can only send to yourself/verified emails.
        const emails = users.map(user => {
            const emailAddress = user.emailAddresses[0]?.emailAddress;
            if (!emailAddress) return null;

            return {
                from: 'Traders League <onboarding@resend.dev>', // Update to your verified domain later
                to: emailAddress,
                subject: '🏆 Your $100,000 Portfolio is Ready (New Season Starts Day 1)',
                html: htmlContent.replace('[[LEAGUE_URL]]', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/league`),
            };
        }).filter(Boolean);

        // 4. Send in batches (Resend limit: 100 per batch call)
        // For simplicity, we send them one by one or in small batches here
        // Using batch API for performance
        if (emails.length > 0) {
            const { data, error } = await resend.batch.send(emails as any);
            if (error) {
                console.error("Resend Batch Error:", error);
                return { success: false, error: error.message };
            }
            return { success: true, count: emails.length, data };
        }

        return { success: false, error: "No valid email addresses found." };

    } catch (error: any) {
        console.error("Broadcast failed:", error);
        return { success: false, error: error.message || "Internal server error" };
    }
}
