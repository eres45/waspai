"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Cpu,
  ShieldCheck,
  Scale,
  Zap,
  HelpCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";

export default function UsageLimitBestPractices() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black pointer-events-none z-0" />

      {/* Header Container */}
      <header className="relative z-10 border-b border-zinc-900 bg-black/60 backdrop-blur-md sticky top-0">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white hover:bg-zinc-900"
              onClick={() => {
                if (
                  typeof window !== "undefined" &&
                  window.history.length > 1
                ) {
                  window.history.back();
                } else {
                  window.location.href = "/";
                }
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="font-semibold text-white tracking-wide">
              Usage Guide
            </span>
          </div>
          <Link
            href="/subscription"
            className="text-xs text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
          >
            View Subscription Plans
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16 flex-1 w-full">
        {/* Title and Intro */}
        <div className="space-y-6 mb-16 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950 text-xs text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            Optimization Guide
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Usage Limits &amp; Best Practices
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
            Understand how fair-use policy limits work on Wasp AI and learn the
            best strategies to optimize your prompts, conserve tokens, and
            maximize your access.
          </p>
        </div>

        {/* Why Limits Exist Card */}
        <Card className="bg-zinc-950 border-zinc-900 mb-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-zinc-700" />
          <CardHeader className="p-8">
            <CardTitle className="text-xl flex items-center gap-3 text-white">
              <Scale className="w-5 h-5 text-zinc-400" />
              Why are usage limits enforced?
            </CardTitle>
            <CardDescription className="text-zinc-500 mt-1">
              Our models are powered by high-performance APIs and computing
              servers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 text-sm text-zinc-400 leading-relaxed space-y-4">
            <p>
              To keep subscription prices up to{" "}
              <strong className="text-white">60% cheaper</strong> than other
              providers, Wasp AI uses a shared rate-limiting and client-side
              processing architecture. Usage limits are designed to protect the
              system from automated abuse and ensure that server computing
              capacity is distributed fairly among all active subscribers.
            </p>
            <p>
              Limits are tracked dynamically using a{" "}
              <strong className="text-white">rolling daily window</strong>. If
              you hit a limit, it resets automatically as the window advances,
              or you can switch to one of our highly capable, lower-overhead
              models to continue working immediately.
            </p>
          </CardContent>
        </Card>

        {/* Grid of Best Practices */}
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-zinc-400" />
          Key Optimization Best Practices
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Card 1: Prompt Optimization */}
          <Card className="bg-zinc-950 border-zinc-900 hover:border-zinc-800 transition-colors shadow-lg">
            <CardHeader className="p-6">
              <CardTitle className="text-base flex items-center gap-3.5 text-white">
                <Cpu className="w-4.5 h-4.5 text-zinc-500" />
                Prompt Caching &amp; Context Size
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 text-xs text-zinc-400 leading-relaxed space-y-3">
              <p>
                Avoid pasting the same huge documents repeatedly into
                consecutive messages. Instead, use a single session or attach
                files once. Long chats consume exponentially more tokens since
                the entire chat history is sent to the AI on each message.
              </p>
              <p className="border-t border-zinc-900 pt-3 text-[11px] text-zinc-500">
                💡 <strong>Tip:</strong> Start a fresh chat once you shift to a
                different sub-task to clear out long context history and reset
                token load.
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Model Choice */}
          <Card className="bg-zinc-950 border-zinc-900 hover:border-zinc-800 transition-colors shadow-lg">
            <CardHeader className="p-6">
              <CardTitle className="text-base flex items-center gap-3.5 text-white">
                <Zap className="w-4.5 h-4.5 text-zinc-500" />
                Model Tier Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 text-xs text-zinc-400 leading-relaxed space-y-3">
              <p>
                For simple tasks like code refactoring, proofreading,
                translating, or summarizing, use fast models like{" "}
                <strong>GPT-4o Mini</strong>, <strong>Claude Haiku</strong>, or{" "}
                <strong>Gemini Flash</strong>. Keep massive reasoning models
                (like Claude Opus, GPT-4o, DeepSeek R1) for complex system
                design and deep logic.
              </p>
              <p className="border-t border-zinc-900 pt-3 text-[11px] text-zinc-500">
                💡 <strong>Tip:</strong> Free models are unlimited for all
                tiers, providing a high-performance fallback for standard
                requests.
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Files & Uploads */}
          <Card className="bg-zinc-950 border-zinc-900 hover:border-zinc-800 transition-colors shadow-lg">
            <CardHeader className="p-6">
              <CardTitle className="text-base flex items-center gap-3.5 text-white">
                <ShieldCheck className="w-4.5 h-4.5 text-zinc-500" />
                Document Parsing &amp; Uploads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 text-xs text-zinc-400 leading-relaxed space-y-3">
              <p>
                Before uploading massive PDFs or scans, check if you can isolate
                the specific page ranges or copy‑paste only the relevant code or
                paragraphs. Eliminating junk tables or scanned image backgrounds
                from documents drastically improves parsing speed and conserves
                limit quota.
              </p>
              <p className="border-t border-zinc-900 pt-3 text-[11px] text-zinc-500">
                💡 <strong>Tip:</strong> Pre-cleaning files leads to
                significantly cleaner AI answers since the model is not
                distracted by irrelevant context.
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Web Search & Tools */}
          <Card className="bg-zinc-950 border-zinc-900 hover:border-zinc-800 transition-colors shadow-lg">
            <CardHeader className="p-6">
              <CardTitle className="text-base flex items-center gap-3.5 text-white">
                <Clock className="w-4.5 h-4.5 text-zinc-500" />
                Web Search &amp; Tool Loop Control
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 text-xs text-zinc-400 leading-relaxed space-y-3">
              <p>
                Tools like live Web Search and Sandbox Code Execution make
                multiple calls to external services. Disable web search for
                coding sessions or creative writing where access to the live
                internet is not required.
              </p>
              <p className="border-t border-zinc-900 pt-3 text-[11px] text-zinc-500">
                💡 <strong>Tip:</strong> Keeping search toggled off unless you
                need real-time data or latest news saves substantial time and
                API usage.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-zinc-400" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-6 border-t border-zinc-900 pt-6">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-white">
              Do my limits carry over to the next billing cycle?
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              No. Quotas are calculated dynamically on a rolling daily basis
              rather than monthly batches. If you hit a limit, your access will
              gradually restore within 24 hours.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold text-white">
              Why does Anthropic&apos;s or developer discretion affect pricing?
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Third-party model providers (like Anthropic, OpenAI, or Google)
              adjust their API credit rates and usage terms periodically. We
              reserve the right to align limits and tier parameters to match
              upstream cost structure changes.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold text-white">
              Can I monitor my current token utilization?
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Yes, in your portal dashboard we show active usage stats. The
              system also triggers a warning toast if you are approaching a
              standard daily rate cap, suggesting optimal models for fallback.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-8 text-center text-xs text-zinc-600 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <p>© {new Date().getFullYear()} Wasp AI. All rights reserved.</p>
          <p className="mt-2 text-zinc-700">
            Usage limits are subject to change. Upstream model costs apply at
            the discretion of their respective owners.
          </p>
        </div>
      </footer>
    </div>
  );
}
