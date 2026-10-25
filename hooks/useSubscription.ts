"use client";

import { useAuth } from "@clerk/nextjs";
import { useSubscription as useBillingSubscription } from "@clerk/nextjs/experimental";
import {
  getPlanFromHas,
  getPlanFromSubscriptionItems,
  PLAN_LIMITS,
  type PlanType,
} from "@/lib/subscription-constants";

export function useSubscription() {
  const authState = useAuth();
  const isSignedIn = authState.isSignedIn === true;
  const { data: subscription } = useBillingSubscription({
    for: "user",
    enabled: isSignedIn,
  });
  const plan: PlanType = !isSignedIn
    ? "free"
    : subscription
      ? getPlanFromSubscriptionItems(subscription.subscriptionItems)
      : getPlanFromHas(authState.has);

  return {
    isLoaded: authState.isLoaded,
    isSignedIn,
    plan,
    limits: PLAN_LIMITS[plan],
  };
}