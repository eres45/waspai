"use client";

import * as React from "react";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    id: "free",
    name: "Free",
    icon: Sparkles,
    price: { monthly: "0", annual: "0" },
    description:
      "Essential features for casual AI users and developers testing the waters.",
    features: [
      "Gemma 2, Qwen 2.5, Phi-4",
      "5 file uploads per day",
      "5 image generations per day",
      "Community support access",
      "Basic tool access",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    price: { monthly: "10", annual: "100" },
    period: "/mo",
    description:
      "The complete AI toolkit for power users and professional developers.",
    features: [
      "GPT-4o Mini, Claude Haiku, Gemini Flash",
      "Unlimited tools & deep search",
      "Pro image generation models",
      "MCP Servers & HTTP workflows",
      "YouTube & Memory modules",
      "Priority email support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "ultra",
    name: "Ultra",
    icon: Crown,
    price: { monthly: "32", annual: "320" },
    period: "/mo",
    description:
      "The ultimate frontier models for heavy production and complex orchestration.",
    features: [
      "GPT-4o, Claude 3.5 Opus, Gemini Pro",
      "Advanced Video & Music Gen",
      "ElevenLabs Voice Integration",
      "Reasoning Models (o1, R1)",
      "4K Image Upscaling",
      "Priority live chat support",
    ],
    cta: "Upgrade to Ultra",
    highlighted: false,
  },
];

export function Pricing() {
  const [billingPeriod, setBillingPeriod] = React.useState<
    "monthly" | "annual"
  >("monthly");

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Fair Pricing,{" "}
            <span className="text-white/60">Unlimited Potential</span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto mb-10">
            Choose the power you need. Switch plans anytime. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center p-1 bg-white/5 rounded-full border border-white/10">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-medium transition-all",
                  billingPeriod === "monthly"
                    ? "bg-white text-black shadow-lg"
                    : "text-white/60 hover:text-white",
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                  billingPeriod === "annual"
                    ? "bg-white text-black shadow-lg"
                    : "text-white/60 hover:text-white",
                )}
              >
                Annual
                <Badge
                  variant="secondary"
                  className="bg-white/10 text-white border-none px-2 py-0 h-5 text-[10px]"
                >
                  -17%
                </Badge>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price =
              billingPeriod === "monthly"
                ? plan.price.monthly
                : plan.price.annual;
            const periodLabel = billingPeriod === "monthly" ? "/mo" : "/yr";

            return (
              <FeatureCard key={plan.id} highlighted={plan.highlighted}>
                {plan.badge && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <Badge className="bg-white text-black border-none px-4 py-1.5 rounded-full shadow-lg shadow-white/20 text-xs font-bold uppercase tracking-wider">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="p-8 pb-4">
                  <div className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <Icon className="size-6 text-white/80" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-white/40 text-sm leading-relaxed">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-8 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      ${price}
                    </span>
                    {plan.id !== "free" && (
                      <span className="text-white/40 text-lg">
                        {periodLabel}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="px-8 pb-8 flex-1 flex flex-col">
                  <div className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className="size-4 text-white/60 mt-1 flex-shrink-0" />
                        <span className="text-sm text-white/60">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => {
                      if (plan.id === "pro")
                        window.location.href = "/checkout/pro";
                      else if (plan.id === "ultra")
                        window.location.href = "/checkout/ultra";
                      else window.location.href = "/auth";
                    }}
                    className={cn(
                      "w-full h-12 rounded-none font-bold transition-all",
                      plan.highlighted
                        ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10"
                        : "bg-white/5 text-white border border-white/10 hover:bg-white/10",
                    )}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </FeatureCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const FeatureCard = ({
  children,
  highlighted,
  className,
}: {
  children: React.ReactNode;
  highlighted?: boolean;
  className?: string;
}) => (
  <Card
    className={cn(
      "group relative rounded-none shadow-none border-white/5 bg-[#161618] flex flex-col transition-all duration-500",
      highlighted && "ring-1 ring-white/20 md:scale-[1.02] z-10",
      className,
    )}
  >
    <CardDecorator />
    {children}
  </Card>
);

const CardDecorator = () => (
  <>
    <span className="border-white/20 absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
    <span className="border-white/20 absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
    <span className="border-white/20 absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
    <span className="border-white/20 absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
  </>
);
