"use client";

import { PricingTable, useAuth } from "@clerk/nextjs";
import { useSubscription as useBillingSubscription } from "@clerk/nextjs/experimental";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { PLAN_LIMITS, type PlanType } from "@/lib/subscription-constants";

const plans: readonly PlanType[] = ["free", "standard", "pro"];

const descriptions: Record<PlanType, string> = {
  free: "A simple way to try the app with one book and short voice sessions.",
  standard: "Ideal for regular reading with more books, longer sessions, and saved history.",
  pro: "Best for deep reading and heavy use, with long sessions and saved history.",
};

function getFeaturePoints(plan: PlanType): string[] {
  const limits = PLAN_LIMITS[plan];

  return [
    `Upload ${limits.maxBooks} ${limits.maxBooks === 1 ? "book" : "books"}`,
    limits.maxSessionsPerMonth === null
      ? "Unlimited voice sessions"
      : `${limits.maxSessionsPerMonth} voice sessions / month`,
    `Up to ${limits.maxSessionMinutes} minutes per session`,
    limits.hasSessionHistory ? "Session history saved" : "No session history",
  ];
}

export default function SubscriptionPricingTable() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const subscriptionStateRef = useRef<string | null>(null);
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { data: subscription, isFetching } = useBillingSubscription({ for: "user", enabled: isSignedIn === true });

  useEffect(() => {
    if (!subscription || isFetching) return;

    const state = subscription.subscriptionItems
      .map(({ id, plan, planPeriod, status, canceledAt }) =>
        [id, plan.slug, planPeriod, status, canceledAt?.getTime() ?? ""].join(":"),
      )
      .sort()
      .join("|");

    if (subscriptionStateRef.current === null) {
      subscriptionStateRef.current = state;
    } else if (subscriptionStateRef.current !== state) {
      subscriptionStateRef.current = state;
      router.replace("/");
    }
  }, [subscription, isFetching, router]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // PricingTable gets its features from Clerk Dashboard. Keep the billing
    // controls, but show the limits that this app actually enforces.
    const syncPlanCopy = () => {
      for (const plan of plans) {
        const cardClass = plan === "free" ? "free_user" : plan;
        const card = wrapper.querySelector<HTMLElement>(
          `.cl-pricingTableCard__${cardClass}`,
        );
        if (!card) continue;

        const header = card.querySelector<HTMLElement>(".cl-pricingTableCardHeader");
        header?.querySelector(".cl-pricingTableCardDescription")?.classList.add("bookified-native-description");
        if (header && !header.querySelector(".bookified-plan-description")) {
          const description = document.createElement("p");
          description.className = "bookified-plan-description";
          description.textContent = descriptions[plan];
          const fee = header.querySelector(".cl-pricingTableCardFeeContainer");
          if (fee) fee.before(description);
          else header.append(description);
        }

        const body = card.querySelector<HTMLElement>(".cl-pricingTableCardBody");
        if (!body) continue;

        const nativeFeatures = body.querySelector<HTMLElement>(
          ".cl-pricingTableCardFeatures",
        );
        nativeFeatures?.classList.add("bookified-native-features");

        let list = body.querySelector<HTMLElement>(".bookified-plan-features");
        if (!list) {
          list = document.createElement("ul");
          list.className = "bookified-plan-features";
          for (const point of getFeaturePoints(plan)) {
            const item = document.createElement("li");
            item.textContent = point;
            list.append(item);
          }
        }

        const footer = body.querySelector(".cl-pricingTableCardFooter");
        if (footer && list.nextElementSibling !== footer) footer.before(list);
        else if (!footer && !list.isConnected) body.append(list);
      }
    };

    syncPlanCopy();
    const observer = new MutationObserver(syncPlanCopy);
    observer.observe(wrapper, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="clerk-pricing-table-wrapper w-full">
      <PricingTable
        for="user"
        highlightedPlan="standard"
        ctaPosition="bottom"
        newSubscriptionRedirectUrl="/"
        appearance={{ variables: { colorPrimary: "#212a3b" } }}
        checkoutProps={{ appearance: { variables: { colorPrimary: "#212a3b" } } }}
      />
    </div>
  );
}
