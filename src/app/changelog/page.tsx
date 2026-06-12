"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Brain,
  FileText,
  Globe,
  ImageIcon,
  MonitorPlay,
  Shield,
  Sparkles,
  Terminal,
  Workflow,
  Wrench,
  Zap,
  Package,
  AlertCircle,
  RefreshCw,
  Star,
} from "lucide-react";

/* ─── Tag config ─────────────────────────────────────────── */
type TagName =
  | "New"
  | "Improvement"
  | "Fix"
  | "Security"
  | "Breaking"
  | "AI"
  | "Workflows"
  | "Agents"
  | "Images"
  | "Files"
  | "Web"
  | "Code"
  | "Memory"
  | "Billing"
  | "Landing"
  | "Performance";

const TAG_STYLES: Record<TagName, string> = {
  New: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  Improvement: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  Fix: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  Security: "bg-red-500/15 text-red-300 border-red-500/25",
  Breaking: "bg-rose-600/15 text-rose-300 border-rose-600/25",
  AI: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
  Workflows: "bg-teal-500/15 text-teal-300 border-teal-500/25",
  Agents: "bg-violet-500/15 text-violet-300 border-violet-500/25",
  Images: "bg-pink-500/15 text-pink-300 border-pink-500/25",
  Files: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  Web: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
  Code: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  Memory: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  Billing: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
  Landing: "bg-slate-500/15 text-slate-300 border-slate-500/25",
  Performance: "bg-lime-500/15 text-lime-300 border-lime-500/25",
};

/* ─── Release data ───────────────────────────────────────── */
interface Release {
  version: string;
  date: string;
  label?: "Latest" | "Major";
  summary: string;
  icon: React.ElementType;
  iconColor: string;
  changes: {
    title: string;
    description: string;
    tags: TagName[];
  }[];
}

const RELEASES: Release[] = [
  {
    version: "1.25.0",
    date: "June 12, 2026",
    label: "Latest",
    summary:
      "New public marketing pages, expanded footer with legal links, and full policy compliance.",
    icon: Star,
    iconColor: "text-amber-400",
    changes: [
      {
        title: "Public Workflows marketing page",
        description:
          "Brand-new /workflows page showcasing all 9 node types, live animated canvas, example templates, tier comparison, and FAQ — accessible without login.",
        tags: ["New", "Landing", "Workflows"],
      },
      {
        title: "Public AI Agents marketing page",
        description:
          "New /ai-agents page with tool arsenal (30+ tools across 8 categories), agent examples, comparison table vs plain chat, and pricing callout.",
        tags: ["New", "Landing", "Agents"],
      },
      {
        title: "Public Features page",
        description:
          "Comprehensive /features page covering all 9 feature groups — AI Models, Agents, Workflows, Images, Code, Files, Web, Memory, and Communication.",
        tags: ["New", "Landing"],
      },
      {
        title: "Expanded footer with legal & policy links",
        description:
          "Footer rebuilt into a 4-column layout with working links to Privacy, Terms, Refund, Shipping, System Status, About, and Contact Support.",
        tags: ["Improvement", "Landing"],
      },
      {
        title: "Footer product links now point to dedicated pages",
        description:
          "Features, Workflows, and Agents footer links now navigate to their dedicated marketing pages instead of page anchors.",
        tags: ["Improvement", "Landing"],
      },
    ],
  },
  {
    version: "1.24.0",
    date: "June 11, 2026",
    label: "Major",
    summary:
      "Security hardening, tier enforcement, About page overhaul, and branding cleanup.",
    icon: Shield,
    iconColor: "text-blue-400",
    changes: [
      {
        title: "Tier-based model gating",
        description:
          "Free users are now blocked from selecting or calling Pro/Ultra models — a focused upgrade popup with the model name surfaces instead.",
        tags: ["New", "Billing", "AI"],
      },
      {
        title: "Weekly Cloud Browser limits",
        description:
          "Cloud Browser usage is now limited by subscription tier — 5 min (Free), 30 min (Pro), 120 min (Ultra) — tracked and enforced per week.",
        tags: ["New", "Billing", "Web"],
      },
      {
        title: "Workflow and agent creation limits",
        description:
          "Enforced tier-based creation caps: Free users cannot create workflows or agents; Pro gets up to 5 of each; Ultra is unlimited.",
        tags: ["New", "Billing", "Workflows", "Agents"],
      },
      {
        title: "About page core values & Eres branding",
        description:
          "Rewrote the About page with Wasp AI's mission, core values (Mission First, User Obsessed, Ship Fast), and updated owner attribution to Eres.",
        tags: ["Improvement", "Landing"],
      },
      {
        title: "Removed all Better Chatbot branding",
        description:
          "Removed every mention of 'Better Chatbot' (formerly known as) from all pages, footer, metadata, and documentation.",
        tags: ["Improvement", "Landing"],
      },
      {
        title: "About page navigation fixed",
        description:
          "Fixed non-functional Back to Home button on the About page and added the full site footer.",
        tags: ["Fix", "Landing"],
      },
      {
        title: "Dependency security upgrades",
        description:
          "Upgraded vulnerable dependencies and resolved a type mismatch in admin actions to eliminate security warnings.",
        tags: ["Security", "Fix"],
      },
    ],
  },
  {
    version: "1.23.0",
    date: "June 5, 2026",
    summary:
      "Cloud Browser, superlight web scraping, and subscription UX overhaul.",
    icon: Globe,
    iconColor: "text-cyan-400",
    changes: [
      {
        title: "Cloud Browser (Steel) integration",
        description:
          "Interactive cloud browser tool — click, scroll, fill forms, and screenshot any website directly from chat.",
        tags: ["New", "Web"],
      },
      {
        title: "Superlight web scraper",
        description:
          "New scrape-web-page tool with 5 modes: scrape, links, sitemap, RSS feed, and batch scraping across multiple URLs simultaneously.",
        tags: ["New", "Web"],
      },
      {
        title: "Focused upgrade popup",
        description:
          "Replaced the full-screen upgrade drawer with a compact, themed modal that shows the specific model or feature the user tried to access.",
        tags: ["Improvement", "Billing"],
      },
      {
        title: "Subscription page accordion FAQ",
        description:
          "Redesigned the pricing page FAQ as an animated accordion and added a full site footer.",
        tags: ["Improvement", "Billing", "Landing"],
      },
      {
        title: "Daily upload & OCR limits for Free tier",
        description:
          "Free plan users are now limited to 5 file uploads and 5 OCR operations per day.",
        tags: ["New", "Billing"],
      },
    ],
  },
  {
    version: "1.22.0",
    date: "May 28, 2026",
    summary:
      "Site builder pipeline, HTML preview, and code execution improvements.",
    icon: MonitorPlay,
    iconColor: "text-emerald-400",
    changes: [
      {
        title: "Premium HTML Preview pipeline",
        description:
          "Full HTML/CSS/JS preview with image embedding, asset inlining, and live site cloning — rendered inside chat.",
        tags: ["New", "Code"],
      },
      {
        title: "Progressive game and site creation pipeline",
        description:
          "Restructured AI pipeline for building games and sites into a 5-task checklist with strict ordering and task tracking.",
        tags: ["New", "Code"],
      },
      {
        title: "Shiki syntax highlighting in file cards",
        description:
          "File card previews now use Shiki for beautiful syntax highlighting across all supported languages.",
        tags: ["Improvement", "Code"],
      },
      {
        title: "Collapsible file operation groups",
        description:
          "Consecutive file write/read operations are now grouped into a single collapsible UI element to reduce visual clutter.",
        tags: ["Improvement"],
      },
      {
        title: "Copy and expand toggle on file previews",
        description:
          "File cards now have a one-click Copy button and a Show Full toggle for long file contents.",
        tags: ["Improvement", "Code"],
      },
    ],
  },
  {
    version: "1.21.0",
    date: "May 20, 2026",
    summary: "Universal file converter, document generation suite expansion.",
    icon: FileText,
    iconColor: "text-sky-400",
    changes: [
      {
        title: "Universal File Converter",
        description:
          "Convert between file formats — PDF to text, PPT to data, and more — with support for extensionless source URLs via MIME type detection.",
        tags: ["New", "Files"],
      },
      {
        title: "PDF export colour fix",
        description:
          "Fixed crashes caused by unsupported oklch/oklab colour functions during PDF export by adding a full CSS colour sanitizer.",
        tags: ["Fix", "Files"],
      },
      {
        title: "OCR text isolation",
        description:
          "OCR-extracted text from uploaded files no longer appears in user message bubbles.",
        tags: ["Fix"],
      },
      {
        title: "File attachment persistence",
        description:
          "Uploaded files and attachments now persist correctly in chat history after page refresh.",
        tags: ["Fix"],
      },
    ],
  },
  {
    version: "1.20.0",
    date: "May 12, 2026",
    summary:
      "Model fallback routing, GPT-OSS reasoning, and multi-model improvements.",
    icon: Brain,
    iconColor: "text-indigo-400",
    changes: [
      {
        title: "Model fallback routing",
        description:
          "Implemented intelligent model fallback routing — if a model call fails, the system automatically retries with a compatible backup.",
        tags: ["New", "AI", "Performance"],
      },
      {
        title: "GPT-OSS reasoning stream restored",
        description:
          "Restored GPT-OSS-120B reasoning stream with proper normalisation for non-streaming worker yields and tool call sanitisation.",
        tags: ["Fix", "AI"],
      },
      {
        title: "Strict provider tool call sanitisation",
        description:
          "Sanitized tool call arguments in chat history for strict OpenAI-compatible providers like Sarvam to prevent completion errors.",
        tags: ["Fix", "AI"],
      },
      {
        title: "Daily web search and image limits",
        description:
          "Enforced per-day limits on web searches and image generations for Free tier users.",
        tags: ["New", "Billing"],
      },
    ],
  },
  {
    version: "1.19.0",
    date: "May 5, 2026",
    summary:
      "Workflow creation engine, MCP protocol, and agent tool expansion.",
    icon: Workflow,
    iconColor: "text-teal-400",
    changes: [
      {
        title: "Visual Workflow Builder",
        description:
          "Full drag-and-drop workflow canvas with 9 node types: Input, Output, LLM, Tool, Condition, HTTP, Template, Code, and Note.",
        tags: ["New", "Workflows"],
      },
      {
        title: "MCP (Model Context Protocol) support",
        description:
          "Connect external MCP servers to extend agents with custom tools from any third-party source.",
        tags: ["New", "Agents"],
      },
      {
        title: "Workflow examples — Baby Research & Get Weather",
        description:
          "Two built-in workflow templates available on launch: a multi-step research pipeline and a live weather fetcher via HTTP.",
        tags: ["New", "Workflows"],
      },
      {
        title: "Workflows as agent tools",
        description:
          "Agents can now trigger your custom workflows mid-conversation, automatically passing the right inputs.",
        tags: ["New", "Agents", "Workflows"],
      },
      {
        title: "Sequential Thinking tool",
        description:
          "New step-by-step reasoning tool that breaks complex problems into structured chains of thought before answering.",
        tags: ["New", "AI"],
      },
    ],
  },
  {
    version: "1.18.0",
    date: "April 25, 2026",
    summary: "Custom agents, persistent memory, and sharing system.",
    icon: Bot,
    iconColor: "text-violet-400",
    changes: [
      {
        title: "Custom AI Agents",
        description:
          "Build agents with a name, emoji icon, system prompt, and selected tools. Agents persist across sessions and can be shared publicly or read-only.",
        tags: ["New", "Agents"],
      },
      {
        title: "Persistent Memory tools",
        description:
          "Save, recall, update, and delete facts across conversations — agents and chat remember what matters to you.",
        tags: ["New", "Memory"],
      },
      {
        title: "AI-generated agent builder",
        description:
          "Describe what you want your agent to do and Wasp AI will generate its name, role, icon, and system prompt automatically.",
        tags: ["New", "Agents", "AI"],
      },
      {
        title: "Shareable cards for agents and workflows",
        description:
          "Agents and workflows can be published publicly, set to read-only, or kept private — with one-click sharing.",
        tags: ["New", "Agents", "Workflows"],
      },
    ],
  },
  {
    version: "1.17.0",
    date: "April 14, 2026",
    summary: "Image editing suite, video generation, and QR code tools.",
    icon: ImageIcon,
    iconColor: "text-pink-400",
    changes: [
      {
        title: "8-tool AI Image Editing Suite",
        description:
          "Remove Background, Enhance Image, Anime Conversion, Remove Object, Super Resolution, Restore Old Photo, Blur Background, and Remove Watermark.",
        tags: ["New", "Images"],
      },
      {
        title: "Video Generation",
        description:
          "Generate short AI videos from text prompts directly in chat.",
        tags: ["New", "Images"],
      },
      {
        title: "QR Code Generator (with logo)",
        description:
          "Generate QR codes for any URL or text — standard or with a custom logo embedded.",
        tags: ["New", "Files"],
      },
      {
        title: "YouTube Transcript tool",
        description:
          "Pull the full transcript from any YouTube video and summarise, translate, or analyse it instantly.",
        tags: ["New", "Web"],
      },
    ],
  },
  {
    version: "1.16.0",
    date: "April 1, 2026",
    summary: "Document generation — Word, PDF, CSV, and Presentations.",
    icon: FileText,
    iconColor: "text-blue-400",
    changes: [
      {
        title: "Word Document generator",
        description:
          "Generate fully formatted .docx files from any prompt, data, or analysis result.",
        tags: ["New", "Files"],
      },
      {
        title: "PDF Report generator",
        description:
          "Create professional PDFs with headings, tables, and styled content from chat.",
        tags: ["New", "Files"],
      },
      {
        title: "PowerPoint Presentation generator",
        description:
          "Build slide decks from outlines or data — exported as .pptx files.",
        tags: ["New", "Files"],
      },
      {
        title: "CSV Export tool",
        description:
          "Export any tabular data, analysis output, or scraped content as a clean CSV file.",
        tags: ["New", "Files"],
      },
    ],
  },
  {
    version: "1.15.0",
    date: "March 20, 2026",
    summary: "Code execution sandbox, web tools, and email communication.",
    icon: Terminal,
    iconColor: "text-orange-400",
    changes: [
      {
        title: "JavaScript & Python Executor",
        description:
          "Execute JS and Python in a live isolated sandbox — compute, analyse data, and run scripts directly in chat.",
        tags: ["New", "Code"],
      },
      {
        title: "Web Search tool",
        description:
          "Real-time web search surfacing up-to-date results beyond the model's training cutoff.",
        tags: ["New", "Web"],
      },
      {
        title: "Web Scraping tool",
        description:
          "Extract structured data and text from any public website on demand.",
        tags: ["New", "Web"],
      },
      {
        title: "Email tools — Send, Temp Inbox, and Read",
        description:
          "Send real emails, create disposable inboxes for signups, and read incoming messages — all from chat.",
        tags: ["New", "Code"],
      },
      {
        title: "HTTP Fetch tool",
        description:
          "Make direct REST API calls to any external endpoint and parse JSON responses inline.",
        tags: ["New", "Web"],
      },
    ],
  },
  {
    version: "1.10.0",
    date: "March 1, 2026",
    summary: "Multi-model support, Google & GitHub OAuth, and initial launch.",
    icon: Sparkles,
    iconColor: "text-white/60",
    changes: [
      {
        title: "20+ AI model support",
        description:
          "Launch with GPT-4o, Claude Sonnet, Gemini 2.5 Pro, Grok 3, DeepSeek V3, Llama 4, Mistral Large, and 14 more models switchable mid-conversation.",
        tags: ["New", "AI"],
      },
      {
        title: "Google & GitHub OAuth",
        description:
          "Sign in with Google or GitHub — no password required, no email auth.",
        tags: ["New", "Security"],
      },
      {
        title: "Wasp AI landing page",
        description:
          "Full marketing landing page with pricing, features, testimonials, and footer.",
        tags: ["New", "Landing"],
      },
      {
        title: "Skills & presets system",
        description:
          "@mention any skill or tool preset in chat to instantly apply a specific behaviour or style.",
        tags: ["New", "AI"],
      },
      {
        title: "Image Generation",
        description:
          "Generate images with Flux and Stable Diffusion from natural language prompts.",
        tags: ["New", "Images"],
      },
    ],
  },
];

/* ─── All filter tags ────────────────────────────────────── */
const ALL_FILTERS: TagName[] = [
  "New",
  "Improvement",
  "Fix",
  "AI",
  "Workflows",
  "Agents",
  "Images",
  "Files",
  "Web",
  "Code",
  "Memory",
  "Billing",
  "Security",
];

/* ─── Tag pill ───────────────────────────────────────────── */
function Tag({ name }: { name: TagName }) {
  return (
    <span
      className={`inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${TAG_STYLES[name]}`}
    >
      {name}
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function ChangelogPage() {
  const [activeFilter, setActiveFilter] = useState<TagName | null>(null);

  const filtered = activeFilter
    ? RELEASES.map((r) => ({
        ...r,
        changes: r.changes.filter((c) => c.tags.includes(activeFilter)),
      })).filter((r) => r.changes.length > 0)
    : RELEASES;

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white selection:bg-white/10 overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">Home</span>
          </Link>
          <div className="text-sm font-bold tracking-widest uppercase">
            WASPAI
          </div>
          <Link
            href="/sign-in"
            className="text-sm font-semibold px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-32">
        {/* ══════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════ */}
        <section className="relative px-6 pt-16 pb-20 text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[13px] font-medium text-white/50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            v1.25.0 — June 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-5"
            style={{
              background:
                "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Changelog
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/40 text-lg max-w-md mx-auto mb-10"
          >
            Every feature, fix, and improvement — in one place. We ship fast and
            keep you updated.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-8 mb-12"
          >
            {[
              { icon: Package, value: "12", label: "Releases" },
              { icon: Zap, value: "60+", label: "Features shipped" },
              { icon: Wrench, value: "30+", label: "Bugs fixed" },
              { icon: RefreshCw, value: "Weekly", label: "Ship cadence" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <s.icon className="w-4 h-4 text-white/25" />
                <span className="text-white font-bold text-[15px]">
                  {s.value}
                </span>
                <span className="text-white/35 text-[13px]">{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            <button
              onClick={() => setActiveFilter(null)}
              className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full border transition-all ${
                activeFilter === null
                  ? "bg-white text-black border-white"
                  : "border-white/10 text-white/40 hover:text-white hover:border-white/20"
              }`}
            >
              All
            </button>
            {ALL_FILTERS.map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  setActiveFilter(activeFilter === tag ? null : tag)
                }
                className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full border transition-all ${
                  activeFilter === tag
                    ? TAG_STYLES[tag] + " opacity-100"
                    : "border-white/10 text-white/40 hover:text-white hover:border-white/20"
                }`}
              >
                {tag}
              </button>
            ))}
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            TIMELINE
        ══════════════════════════════════════════════════════ */}
        <section className="px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-white/15 via-white/8 to-transparent hidden md:block" />

              <div className="flex flex-col gap-16">
                {filtered.map((release, ri) => (
                  <motion.div
                    key={release.version}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: ri * 0.05 }}
                    className="md:pl-16 relative"
                  >
                    {/* Timeline dot */}
                    <div className="hidden md:flex absolute left-0 top-1 w-12 h-12 rounded-2xl bg-[#0d0d0f] border border-white/10 items-center justify-center">
                      <release.icon
                        className={`w-5 h-5 ${release.iconColor}`}
                      />
                    </div>

                    {/* Version header */}
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                      <div className="md:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <release.icon
                          className={`w-4 h-4 ${release.iconColor}`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-2xl font-black text-white tracking-tight">
                            v{release.version}
                          </h2>
                          {release.label === "Latest" && (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 uppercase tracking-wider">
                              Latest
                            </span>
                          )}
                          {release.label === "Major" && (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 uppercase tracking-wider">
                              Major
                            </span>
                          )}
                          <span className="text-[13px] text-white/30 font-medium">
                            {release.date}
                          </span>
                        </div>
                        <p className="text-[14px] text-white/40 mt-0.5">
                          {release.summary}
                        </p>
                      </div>
                    </div>

                    {/* Change list */}
                    <div className="flex flex-col gap-4">
                      {release.changes.map((change, ci) => (
                        <motion.div
                          key={ci}
                          initial={{ opacity: 0, x: -8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: ci * 0.05 }}
                          className="group p-5 rounded-2xl border border-white/6 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all"
                        >
                          <div className="flex flex-wrap items-start gap-3 mb-2">
                            <h3 className="text-[15px] font-bold text-white flex-1 min-w-0">
                              {change.title}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                              {change.tags.map((tag) => (
                                <Tag key={tag} name={tag} />
                              ))}
                            </div>
                          </div>
                          <p className="text-[13px] text-white/40 leading-relaxed">
                            {change.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom note */}
            {!activeFilter && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mt-16 text-center"
              >
                <div className="inline-flex items-center gap-2 text-[13px] text-white/25">
                  <AlertCircle className="w-4 h-4" />
                  This changelog covers v1.10.0 and later. Earlier history is in
                  our GitHub repo.
                </div>
                <div className="mt-4">
                  <a
                    href="https://github.com/eres45/waspai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white transition-colors"
                  >
                    View full history on GitHub
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            CTA
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 mt-24">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent p-12 text-center"
            >
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-white/[0.03] rounded-full blur-[60px] pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                  Want these features? Start today.
                </h2>
                <p className="text-white/40 mb-8 max-w-sm mx-auto">
                  Everything in the changelog is live now on Wasp AI — free to
                  try.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/sign-in"
                    className="group inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 rounded-full font-bold text-[15px] hover:bg-white/90 transition-all"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/features"
                    className="inline-flex items-center gap-2 border border-white/10 text-white/60 hover:text-white hover:border-white/20 px-7 py-3.5 rounded-full font-medium text-[15px] transition-all"
                  >
                    Explore Features
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── Mini footer ── */}
      <div className="border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs font-bold tracking-widest uppercase text-white/30">
            WASPAI
          </span>
          <p className="text-xs text-white/20">
            © 2026 WaspAI Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-6 justify-center">
            {[
              { label: "Features", href: "/features" },
              { label: "Workflows", href: "/workflows" },
              { label: "Agents", href: "/ai-agents" },
              { label: "Pricing", href: "/subscription" },
              { label: "Contact", href: "/contact" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
