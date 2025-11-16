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
import { X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "5 file uploads per day",
      "Access to free AI models",
      "Basic chat features",
      "Message history",
    ],
    cta: "Current Plan",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "For power users",
    features: [
      "Unlimited file uploads",
      "Access to all AI models",
      "Advanced chat features",
      "Priority support",
      "Custom model selection",
      "Image generation (6 models)",
      "Export conversations",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "API access",
      "Custom integrations",
      "Dedicated support",
      "Advanced analytics",
      "SSO authentication",
    ],
    cta: "Contact Sales",
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

  const handleUpgrade = (planName: string) => {
    if (planName === "Enterprise") {
      window.location.href = "mailto:sales@example.com?subject=Enterprise Plan Inquiry";
    } else if (planName === "Pro") {
      window.location.href = "/checkout/pro";
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
              <DrawerTitle className="text-2xl">Subscription Plans</DrawerTitle>
              <DrawerDescription>
                Choose the perfect plan for your needs
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
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col ${
                    plan.highlighted
                      ? "border-primary shadow-lg"
                      : "border-border"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-muted-foreground ml-2">
                          {plan.period}
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-3 flex-1">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2">
                          <Check className="size-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleUpgrade(plan.name)}
                      variant={plan.highlighted ? "default" : "outline"}
                      className="w-full mt-6"
                      disabled={plan.name === "Free"}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="border-t border-border pt-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Can I change plans anytime?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    What payment methods do you accept?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    We accept all major credit cards, PayPal, and other popular payment methods.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Is there a free trial?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Yes! Start with our Free plan and upgrade whenever you're ready. No credit card required.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Do you offer refunds?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    We offer a 30-day money-back guarantee if you're not satisfied with your purchase.
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
