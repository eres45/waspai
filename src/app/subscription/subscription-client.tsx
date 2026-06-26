"use client";

import Link from "next/link";
import { Button } from "ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Badge } from "ui/badge";
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  Globe,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Footer } from "@/components/landing/footer";
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
    INR: { monthly: 399, annual: 3990 },
  },
  ultra: {
    USD: { monthly: 32, annual: 320 },
    INR: { monthly: 999, annual: 9990 },
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
      description:
        "Access to standard models and limited premium features to get started.",
      features: [
        {
          category: "Core Access",
          items: ["Unlimited use of all Free models", "Community support"],
        },
        {
          category: "Limits",
          items: [
            "Limited Cloud Browser use",
            "Limited image generations",
            "Limited memory & indexing",
            "Limited web searches",
            "Limited file uploads",
          ],
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
          category: "Model Access",
          items: [
            "Access to all advanced Pro models",
            "All Free models with faster speed & higher limits",
          ],
        },
        {
          category: "Pro Features",
          items: [
            "Limited Cloud Browser",
            "Pro image generation & advanced image editing",
            "Unlimited file, PDF, & document uploads",
            "Unlimited web search, code execution & tool uses",
            "MCP Servers & custom HTTP workflows",
            "Long-term memory & YouTube transcript analysis",
            "Limited agent creation",
            "Limited workflows, projects, skills & storage",
            "Unlimited social media downloads",
          ],
        },
        {
          category: "Support",
          items: ["24/7 Priority email support"],
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
          category: "Frontier Intelligence",
          items: [
            "Access to all premium Frontier & Reasoning models (Top Priority)",
            "All Free & Pro models with top priority access",
          ],
        },
        {
          category: "Ultra Studio & Features",
          items: [
            "All image generation models & advanced editing tools",
            "Priority Cloud Browser",
            "Video generation",
            "Web access & unlimited advanced search",
          ],
        },
        {
          category: "Unlimited Capabilities",
          items: [
            "Unlimited Workflows & custom Skills",
            "Unlimited projects, storage & databases",
            "Unlimited custom agents & private execution",
          ],
        },
        {
          category: "Integrations & Dev",
          items: ["MCP Servers & custom API integrations"],
        },
        {
          category: "Support & Access",
          items: [
            "Priority support & dedicated assistance",
            "Early access to new features",
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/";
              }
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-6">
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
                            <div
                              key={feature}
                              className="flex items-start gap-3"
                            >
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
        <div className="mt-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            All prices shown in{" "}
            <span className="font-semibold">{CURRENCIES[currency].code}</span>.
            Enterprise plans available -{" "}
            <a
              href="mailto:sales@example.com"
              className="text-primary hover:underline"
            >
              contact us
            </a>
            .
          </p>
          <p className="text-xs text-muted-foreground/60">
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
      </div>

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Is usage truly unlimited?",
    a: "We offer unlimited conversational turns with no daily or monthly caps. Fair-use rate limits (per-minute / per-hour) apply to prevent automated abuse — they reset automatically within minutes and are rarely noticeable during normal use.",
  },
  {
    q: "Can I change plans anytime?",
    a: "Yes. Upgrade or downgrade at any time. Changes take effect immediately, and your billing is pro-rated so you only ever pay for what you use.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit & debit cards, UPI (India), PayPal, and other popular regional payment methods. Secure checkout is powered by Razorpay.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes — we offer a 7-day money-back guarantee. If you are not satisfied with your purchase, contact support within 7 days and we will issue a full refund, no questions asked.",
  },
  {
    q: "Why are you so much cheaper than competitors?",
    a: "Our multi-provider architecture and efficient infrastructure keep operational costs low. We pass those savings directly to you — no investor-funded subsidies, just honest pricing.",
  },
  {
    q: "How do I contact support?",
    a: "Pro & Ultra subscribers get priority email support and live chat. Free users can reach us via community forums or our contact page. We typically respond within a few hours.",
  },
];

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) =>
    setOpenIdx((prev) => (prev === idx ? null : idx));

  return (
    <div className="border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Two-column layout: label left, accordion right */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* Left label */}
          <div className="lg:w-56 flex-shrink-0">
            <h2 className="text-3xl font-bold text-foreground">FAQ</h2>
          </div>

          {/* Right accordion in a dark rounded card */}
          <div className="flex-1 rounded-2xl border border-border/60 bg-muted/20 overflow-hidden divide-y divide-border/50">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div key={idx}>
                  <button
                    onClick={() => toggle(idx)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group hover:bg-muted/30 transition-colors duration-150"
                  >
                    <span
                      className={`text-sm font-medium transition-colors duration-150 ${
                        isOpen
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`size-4 flex-shrink-0 text-muted-foreground transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-48" : "max-h-0"
                    }`}
                  >
                    <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
