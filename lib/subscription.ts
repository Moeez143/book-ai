import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  getPlanFromHas,
  getPlanFromSubscriptionItems,
  PLAN_LIMITS,
  type PlanType,
} from "@/lib/subscription-constants";

export async function getServerSubscription() {
  const { userId, has } = await auth();
  if (!userId) {
    return { userId, plan: "free" as PlanType, limits: PLAN_LIMITS.free };
  }

  let plan: PlanType;
  try {
    const client = await clerkClient();
    const subscription = await client.billing.getUserBillingSubscription(userId);
    plan = getPlanFromSubscriptionItems(subscription.subscriptionItems);
  } catch (error) {
    console.error("Unable to fetch current Clerk billing subscription:", error);
    plan = getPlanFromHas(has);
  }

  return { userId, plan, limits: PLAN_LIMITS[plan] };
}