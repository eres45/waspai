"use client";

import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerPortal,
  DrawerTitle,
} from "ui/drawer";
import { Button } from "ui/button";
import Link from "next/link";
import { X, Sparkles, Zap, Crown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Badge } from "ui/badge";
import { Check } from "lucide-react";

// Simple pricing data (INR default for popup)
const plans = [
  {
    id: "free",
    name: "Free",
    icon: Sparkles,
    price: "₹0",
    description: "Essential features for casual AI users",
    features: [
      "Unlimited use of all Free models",
      "Limited Cloud Browser use",
      "Limited image generations",
      "Limited memory & indexing",
      "Limited web searches",
      "Limited file uploads",
      "Community support",
    ],
    cta: "Current Plan",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    price: "₹830",
    period: "/month",
    description: "Access to most top AIs and features",
    features: [
      "Access to advanced Pro models",
      "All Free models with faster speed & limits",
      "Limited Cloud Browser",
      "Pro image generation & advanced image editing",
      "Unlimited web search, code execution & tools",
      "Unlimited file, PDF, & document uploads",
      "MCP Servers & custom HTTP workflows",
      "Limited workflows, projects, skills & storage",
      "Limited agent creation",
      "24/7 Priority email support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
    savings: "60% cheaper than competitors",
  },
  {
    id: "ultra",
    name: "Ultra",
    icon: Crown,
    price: "₹2,660",
    period: "/month",
    description: "Maximum power for heavy users",
    features: [
      "Access to all premium Frontier & Reasoning models (Top Priority)",
      "Priority Cloud Browser",
      "All image models, tools & Video generation",
      "Web access & unlimited advanced search",
      "Unlimited workflows, projects, skills & agents",
      "Unlimited storage & custom MCP integrations",
      "Priority support & dedicated assistance",
      "Early access to new features",
    ],
    cta: "Upgrade to Ultra",
    highlighted: false,
  },
];

export function SubscriptionPopup() {
  const [openSubscription, appStoreMutate] = appStore(
    useShallow((state) => [state.openSubscription, state.mutate]),
  );

  const handleClose = () => {
    appStoreMutate({ openSubscription: false });
  };

  const handleUpgrade = (planId: string) => {
    if (planId === "pro") {
      window.location.href = "/checkout/pro";
    } else if (planId === "ultra") {
      window.location.href = "/checkout/ultra";
    } else {
      // Redirect to full plans page
      window.location.href = "/subscription";
    }
  };

  return (
    <Drawer
      handleOnly
      open={openSubscription}
      direction="top"
      onOpenChange={(open) => appStoreMutate({ openSubscription: open })}
    >
      <DrawerPortal>
        <DrawerContent
          style={{
            userSelect: "text",
          }}
          className="max-h-[100vh]! w-full h-full rounded-none flex flex-col overflow-hidden p-4 md:p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <DrawerTitle className="text-2xl flex items-center gap-2">
                Choose Your Plan
                <Badge variant="secondary" className="text-xs">
                  60% cheaper
                </Badge>
              </DrawerTitle>
              <DrawerDescription>
                Unlimited usage with rate limits. Premium features. Unbeatable
                value.
              </DrawerDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              data-testid="close-subscription-button"
            >
              <X />
            </Button>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div className="grid md:grid-cols-3 gap-6 pb-6">
              {plans.map((plan) => {
                const Icon = plan.icon;
                return (
                  <Card
                    key={plan.id}
                    className={`relative flex flex-col transition-all ${
                      plan.highlighted
                        ? "border-primary shadow-lg ring-1 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-primary to-primary/80 text-xs">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="size-5 text-primary" />
                        </div>
                        {plan.savings && (
                          <Badge variant="secondary" className="text-xs">
                            {plan.savings}
                          </Badge>
                        )}
                      </div>

                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {plan.description}
                      </CardDescription>

                      <div className="mt-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">
                            {plan.price}
                          </span>
                          {plan.period && (
                            <span className="text-muted-foreground text-sm">
                              {plan.period}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col">
                      <div className="space-y-2 flex-1">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-start gap-2">
                            <Check className="size-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-foreground leading-relaxed">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() => handleUpgrade(plan.id)}
                        variant={plan.highlighted ? "default" : "outline"}
                        size="sm"
                        className={`w-full mt-4 ${
                          plan.highlighted
                            ? "bg-gradient-to-r from-primary to-primary/90"
                            : ""
                        }`}
                        disabled={plan.id === "free"}
                      >
                        {plan.cta}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* View Full Details Link */}
            <div className="text-center pt-4 border-t border-border flex flex-col items-center gap-2">
              <Button
                variant="link"
                onClick={() => (window.location.href = "/subscription")}
                className="text-sm h-auto p-0"
              >
                View full pricing details & features →
              </Button>
              <p className="text-[10px] text-muted-foreground/60">
                <Link
                  href="/usage-limit-best-practices"
                  className="underline hover:text-primary transition-colors"
                >
                  *Usage limits apply
                </Link>
                . Prices and plans are subject to change at Anthropic&apos;s
                discretion.
              </p>
            </div>

            {/* Compact FAQ */}
            <div className="border-t border-border pt-6 mt-2">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Quick FAQ
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    Can I change plans anytime?
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Yes! Upgrade or downgrade anytime. Changes take effect
                    immediately.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    What payment methods?
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Credit cards, UPI (India), PayPal, and more.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    Do you offer refunds?
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    30-day money-back guarantee if not satisfied.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    Why so cheap?
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Client-side processing and multi-provider architecture keep
                    costs low!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
