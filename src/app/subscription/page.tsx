"use client";

import { Button } from "ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Badge } from "ui/badge";
import { Check, Sparkles, Zap, Crown, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";

// Currency configuration
type Currency = "USD" | "INR";

interface CurrencyConfig {
  symbol: string;
  code: string;
  locale: string;
}

const CURRENCIES: Record<Currency, CurrencyConfig> = {
  USD: {
    symbol: "$",
    code: "USD",
    locale: "en-US",
  },
  INR: {
    symbol: "₹",
    code: "INR",
    locale: "en-IN",
  },
};

// Pricing data
const PRICING = {
  pro: {
    USD: { monthly: 10, annual: 100 },
    INR: { monthly: 830, annual: 8300 },
  },
  ultra: {
    USD: { monthly: 32, annual: 320 },
    INR: { monthly: 2660, annual: 26600 },
  },
};

// Auto-detect currency based on user location
async function detectUserCurrency(): Promise<Currency> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    return data.country_code === "IN" ? "INR" : "USD";
  } catch {
    return "USD"; // Default fallback
  }
}

export default function SubscriptionPage() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [isLoading, setIsLoading] = useState(true);

  // Auto-detect currency on mount
  useEffect(() => {
    detectUserCurrency().then((detected) => {
      setCurrency(detected);
      setIsLoading(false);
    });
  }, []);

  const formatPrice = (amount: number) => {
    const config = CURRENCIES[currency];
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPrice = (tier: "pro" | "ultra") => {
    return PRICING[tier][currency][billingPeriod];
  };

  const getSavings = (tier: "pro" | "ultra") => {
    const monthly = PRICING[tier][currency].monthly * 12;
    const annual = PRICING[tier][currency].annual;
    const savings = monthly - annual;
    const percentage = Math.round((savings / monthly) * 100);
    return { amount: savings, percentage };
  };

  const plans = [
    {
      id: "free",
      name: "Free",
      icon: Sparkles,
      price: "0",
      description: "Essential features for casual AI users. Perfect to get started.",
      features: [
        {
          category: "AI Models",
          items: [
            "Gemma 2 (9B, 27B)",
            "Qwen 2.5 (all variants)",
            "Phi-4, Mistral 7B",
            "Llama 3.3 (70B)",
            "DeepSeek V3 (free)",
          ],
        },
        {
          category: "Features",
          items: [
            "Basic image generation",
            "5 file uploads/day",
            "5 image generations/day",
            "5 tool uses/day",
            "5 custom characters",
          ],
        },
        {
          category: "Support",
          items: ["Community support", "Starter prompt library"],
        },
      ],
      cta: "Get Started Free",
      highlighted: false,
    },
    {
      id: "pro",
      name: "Pro",
      icon: Zap,
      price: getPrice("pro"),
      priceRaw: PRICING.pro[currency][billingPeriod],
      description:
        "Access to most top AIs and features. Suitable for the majority of users.",
      features: [
        {
          category: "Free Models (Extended Limits)",
          items: ["All Free tier models with higher fair-use limits"],
        },
        {
          category: "Pro Models (Fair-use daily)",
          items: [
            "GPT-4o Mini",
            "Claude 3.5 Haiku",
            "Gemini 2.0 Flash",
            "DeepSeek V3 (full)",
            "Qwen Coder 32B",
            "Mistral Large",
          ],
        },
        {
          category: "Pro Features",
          items: [
            "Pro image generation models",
            "Unlimited tool uses",
            "Unlimited characters",
            "MCP Servers integration",
            "HTTP workflows",
            "Memory persistence",
            "YouTube Analyzer insights",
            "Full prompt library",
            "Email support (24h)",
          ],
        },
      ],
      cta: "Upgrade to Pro",
      highlighted: true,
      badge: "Most Popular",
      savings: getSavings("pro"),
    },
    {
      id: "ultra",
      name: "Ultra",
      icon: Crown,
      price: getPrice("ultra"),
      priceRaw: PRICING.ultra[currency][billingPeriod],
      description:
        "Maximum power and limits for heavy users and professionals.",
      features: [
        {
          category: "All Pro Models (Extended Limits)",
          items: ["All Free & Pro models with highest limits"],
        },
        {
          category: "Ultra Models (Fair-use daily)",
          items: [
            "GPT-4o",
            "Claude 3.5 Sonnet",
            "Claude 3 Opus",
            "Gemini 2.5 Pro",
            "DeepSeek R1",
            "Grok 3",
          ],
        },
        {
          category: "Ultra Features",
          items: [
            "Everything in Pro +",
            "DeathPix Studio (Music Gen)",
            "Advanced video generation",
            "Voice Generation (ElevenLabs)",
            "Image Upscaler",
            "Advanced YouTube reports",
            "Priority live chat support",
            "Dedicated assistance",
            "Early access to features",
          ],
        },
      ],
      cta: "Upgrade to Ultra",
      highlighted: false,
      savings: getSavings("ultra"),
    },
  ];

  const handleUpgrade = (planId: string) => {
    if (planId === "pro") {
      window.location.href = "/checkout/pro";
    } else if (planId === "ultra") {
      window.location.href = "/checkout/ultra";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b border-border/50 backdrop-blur-sm bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-6">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              60% cheaper than competitors
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              Choose Your Plan
            </h1>

            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              Select the perfect plan for your AI needs. Fair-use limits,
              premium features, and
              <span className="text-primary font-semibold">
                {" "}
                unbeatable value
              </span>
              .
            </p>

            {/* Billing Toggle & Currency Selector */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              {/* Billing Period Toggle */}
              <div className="inline-flex items-center rounded-lg bg-muted p-1">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    billingPeriod === "monthly"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("annual")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    billingPeriod === "annual"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Annual
                  <Badge variant="default" className="ml-2 text-xs">
                    Save 17%
                  </Badge>
                </button>
              </div>

              {/* Currency Selector */}
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <Select
                  value={currency}
                  onValueChange={(val) => setCurrency(val as Currency)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all duration-300 hover:shadow-xl ${
                  plan.highlighted
                    ? "border-primary shadow-2xl ring-1 ring-primary/20 lg:scale-105"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {plan.badge && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-primary to-primary/80">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="size-6 text-primary" />
                    </div>
                    {plan.id !== "free" && billingPeriod === "annual" && (
                      <Badge variant="secondary" className="text-xs">
                        Save {plan.savings?.percentage}%
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-3xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {plan.description}
                  </CardDescription>

                  <div className="mt-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold tracking-tight">
                        {plan.id === "free"
                          ? formatPrice(0)
                          : formatPrice(plan.priceRaw!)}
                      </span>
                      {plan.id !== "free" && (
                        <span className="text-muted-foreground text-lg">
                          /{billingPeriod === "monthly" ? "mo" : "yr"}
                        </span>
                      )}
                    </div>
                    {plan.id !== "free" && billingPeriod === "monthly" && (
                      <p className="text-sm text-muted-foreground mt-2">
                        or{" "}
                        {formatPrice(
                          PRICING[plan.id as "pro" | "ultra"][currency].annual /
                            12,
                        )}
                        /mo billed annually
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-6 flex-1">
                    {plan.features.map((section) => (
                      <div key={section.category}>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                          {section.category}
                        </h4>
                        <div className="space-y-3">
                          {section.items.map((feature) => (
                            <div key={feature} className="flex items-start gap-3">
                              <Check className="size-5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-foreground leading-relaxed">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                    className={`w-full mt-8 ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25"
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

        {/* Comparison Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All prices shown in{" "}
            <span className="font-semibold">{CURRENCIES[currency].code}</span>.
            Enterprise plans available -{" "}
            <a href="mailto:sales@example.com" className="text-primary hover:underline">
              contact us
            </a>
            .
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="border-t border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                What does "fair-use" mean?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Fair-use means reasonable daily limits that work for 99% of users.
                We don't show exact numbers to avoid confusion - just use the AI
                naturally!
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Can I change plans anytime?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Yes! Upgrade or downgrade anytime. Changes take effect immediately,
                and we'll pro-rate your billing.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                What payment methods do you accept?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                We accept all major credit cards, UPI (India), PayPal, and other
                popular payment methods.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Do you offer refunds?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Yes! We offer a 30-day money-back guarantee if you're not satisfied
                with your purchase.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Why are you so much cheaper?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Our client-side processing and multi-provider architecture keeps
                costs low. We pass those savings directly to you!
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                How do I contact support?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Email us at support@example.com or use live chat (Pro/Ultra). Free
                users can access community forums.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-border/50 bg-gradient-to-b from-muted/20 to-muted/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Ready to get started?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join users enjoying{" "}
            <span className="text-primary font-semibold">
              premium AI at unbeatable prices
            </span>
            . Start free, upgrade anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => handleUpgrade("pro")} className="min-w-[200px]">
              Upgrade to Pro
            </Button>
            <Button size="lg" variant="outline" className="min-w-[200px]">
              Start Free
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
