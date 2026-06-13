import { Metadata } from "next";
import SubscriptionClientPage from "./subscription-client";

export const metadata: Metadata = {
  title: "Pricing Plans",
  description:
    "Choose the perfect Wasp AI tier for your workflow needs. Explore Pro and Ultra plans with unlimited tokens, advanced models, and weekly cloud browser allowances.",
};

export default function Page() {
  return <SubscriptionClientPage />;
}
