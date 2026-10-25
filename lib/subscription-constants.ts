export type PlanType = "free" | "standard" | "pro";

export interface PlanLimits {
  maxBooks: number;
  maxSessionsPerMonth: number | null;
  maxSessionMinutes: number;
  hasSessionHistory: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: { maxBooks: 1, maxSessionsPerMonth: 2, maxSessionMinutes: 5, hasSessionHistory: false },
  standard: { maxBooks: 5, maxSessionsPerMonth: 20, maxSessionMinutes: 15, hasSessionHistory: true },
  pro: { maxBooks: 50, maxSessionsPerMonth: null, maxSessionMinutes: 60, hasSessionHistory: true },
};

export type HasPlan = (params: { plan: string }) => boolean;

export function getPlanFromHas(has: HasPlan): PlanType {
  if (has({ plan: "pro" })) return "pro";
  if (has({ plan: "standard" })) return "standard";
  return "free";
}

export interface SubscriptionPlanItem {
  status: string;
  plan: { slug: string } | null;
}

export function getPlanFromSubscriptionItems(items: readonly SubscriptionPlanItem[]): PlanType {
  const activePlans = items
    .filter((item) => item.status === "active")
    .map((item) => item.plan?.slug);

  if (activePlans.includes("pro")) return "pro";
  if (activePlans.includes("standard")) return "standard";
  return "free";
}

export function getCurrentBillingPeriodStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function getNextBillingPeriodStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}
