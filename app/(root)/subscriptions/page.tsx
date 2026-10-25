import SubscriptionPricingTable from "@/components/SubscriptionPricingTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription plans | Bookified",
  description: "Choose a Bookified plan for your reading and voice sessions.",
};

export default function SubscriptionsPage() {
  return (
    <main className="clerk-subscriptions">
      <div className="mb-14 max-w-2xl text-center">
        <h1 className="page-title-xl">Subscription Plans</h1>
        <p className="subtitle mt-3">
          Choose the perfect plan for your learning journey.
        </p>
      </div>
      <SubscriptionPricingTable />
    </main>
  );
}
