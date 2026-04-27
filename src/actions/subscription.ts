"use server"

import { auth, clerkClient } from "@clerk/nextjs/server";

export type Plan = "FREE" | "PREMIUM";

/**
 * Gets the current plan for the authenticated user from Clerk metadata.
 */
export async function getUserPlan(): Promise<Plan> {
  const { userId, has } = await auth();
  if (!userId) return "FREE";

  // Priority 1: Official Clerk Billing (if integrated)
  // The 'has' helper checks the JWT session token. 
  // IMPORTANT: You must enable "Billing/Plans" and "Entitlements" in:
  // Clerk Dashboard -> Sessions -> Customize Session Token
  
  const hasOfficialPremium = 
    has({ plan: "stocktracker" }) || 
    has({ plan: "premium" }) || 
    has({ plan: "pro" }) || 
    has({ plan: "Premium" }) || 
    has({ plan: "Pro" }) ||
    has({ plan: "premium-plan" }) ||
    has({ plan: "pro-plan" }) ||
    has({ entitlement: "premium" }) ||
    has({ entitlement: "premium-access" });
  
  if (hasOfficialPremium) return "PREMIUM";

  // Priority 2: Manual Metadata (Legacy/Development)
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  
  const metadataPlan = user.publicMetadata.plan as Plan;
  if (metadataPlan === "PREMIUM") return "PREMIUM";

  return "FREE";
}

/**
 * Helper to check if the user has premium access.
 */
export async function isPremium(): Promise<boolean> {
  const plan = await getUserPlan();
  return plan === "PREMIUM";
}

/**
 * FOR DEVELOPMENT: Manually set a user's plan.
 */
export async function updateUserPlan(plan: Plan) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const client = await clerkClient();
  await client.users.updateUser(userId, {
    publicMetadata: {
      plan: plan
    }
  });
  
  return { success: true, plan };
}

export async function getRoadmapAlertsPreference(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  
  return (user.publicMetadata.roadmapAlertsEnabled as boolean) || false;
}

export async function updateRoadmapAlertsPreference(enabled: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const plan = await getUserPlan();
  if (plan !== "PREMIUM" && enabled) {
    throw new Error("PREMIUM_REQUIRED");
  }

  const client = await clerkClient();
  await client.users.updateUser(userId, {
    publicMetadata: {
      roadmapAlertsEnabled: enabled
    }
  });
  
  return { success: true, enabled };
}
