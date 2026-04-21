"use server"

import { auth, clerkClient } from "@clerk/nextjs/server";

export type Plan = "FREE" | "PREMIUM";

/**
 * Gets the current plan for the authenticated user from Clerk metadata.
 */
export async function getUserPlan(): Promise<Plan> {
  const { userId } = await auth();
  if (!userId) return "FREE";

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  
  // Use publicMetadata to store the plan
  return (user.publicMetadata.plan as Plan) || "FREE";
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
