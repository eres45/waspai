"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BotIcon,
  ChevronDown,
  Code2,
  GitBranch,
  Globe,
  HardDriveUpload,
  HouseIcon,
  InfoIcon,
  LandPlotIcon,
  Layers,
  Play,
  Settings2,
  SplitIcon,
  TerminalIcon,
  TextIcon,
  WrenchIcon,
  Zap,
  FlaskConical,
  CloudSun,
  FileText,
  RefreshCw,
} from "lucide-react";

/* ─── Node type data ─────────────────────────────────────── */
const NODE_TYPES = [
  {
    key: "Input",
    icon: HouseIcon,
    color: "bg-blue-500",
    shadow: "shadow-blue-500/30",
    border: "border-blue-500/30",
    description:
      "Entry point of your workflow. Define the parameters users or systems will pass in.",
  },
  {
    key: "Output",
    icon: LandPlotIcon,
    color: "bg-green-500",
    shadow: "shadow-green-500/30",
    border: "border-green-500/30",
    description:
      "Collects and returns the final result. Every workflow ends here.",
  },
  {
    key: "LLM",
    icon: BotIcon,
    color: "bg-indigo-500",
    shadow: "shadow-indigo-500/30",
    border: "border-indigo-500/30",
    description:
      "Call any AI model — GPT, Claude, Gemini, Grok — with a custom prompt and receive structured output.",
  },
  {
    key: "Tool",
    icon: WrenchIcon,
    color: "bg-blue-400",
    shadow: "shadow-blue-400/30",
    border: "border-blue-400/30",
    description:
      "Use built-in Wasp AI tools: web search, image generation, code execution, and more.",
  },
  {
    key: "Condition",
    icon: SplitIcon,
    color: "bg-amber-500",
    shadow: "shadow-amber-500/30",
    border: "border-amber-500/30",
    description:
      "Branch your workflow with if/else logic. Route different paths based on any condition.",
  },
  {
    key: "HTTP",
    icon: HardDriveUpload,
    color: "bg-rose-500",
    shadow: "shadow-rose-500/30",
    border: "border-rose-500/30",
    description:
      "Call any external REST API — fetch weather, query databases, trigger webhooks, and more.",
  },
  {
    key: "Template",
    icon: TextIcon,
    color: "bg-purple-500",
    shadow: "shadow-purple-500/30",
    border: "border-purple-500/30",
    description:
      "Build dynamic text with variables from earlier nodes. Create prompts, messages, or reports.",
  },
  {
    key: "Code",
    icon: TerminalIcon,
    color: "bg-rose-600",
    shadow: "shadow-rose-600/30",
    border: "border-rose-600/30",
    description:
      "Write custom JavaScript or Python to transform data, compute values, or implement any logic.",
  },
  {
    key: "Note",
    icon: InfoIcon,
    color: "bg-zinc-600",
    shadow: "shadow-zinc-600/30",
    border: "border-zinc-600/30",
    description:
      "Document your workflow with notes. Helps teammates understand the logic at a glance.",
  },
];

/* ─── Example workflows ──────────────────────────────────── */
const EXAMPLES = [
  {
    emoji: "👨‍🔬",
    icon: FlaskConical,
    title: "Baby Research",
    description:
      "Automatically research any topic — searches the web, synthesizes findings with an LLM, and returns a structured report.",
    tags: ["LLM", "Tool", "Output"],
    tagColors: [
      "bg-indigo-500/20 text-indigo-300",
      "bg-blue-400/20 text-blue-300",
      "bg-green-500/20 text-green-300",
    ],
    gradient: "from-indigo-500/10 via-blue-500/5 to-transparent",
  },
  {
    emoji: "🌤️",
    icon: CloudSun,
    title: "Get Weather",
    description:
      "Fetch live weather data via HTTP for any city, format the response with a Template node, and deliver a friendly summary.",
    tags: ["HTTP", "Template", "Output"],
    tagColors: [
      "bg-rose-500/20 text-rose-300",
      "bg-purple-500/20 text-purple-300",
      "bg-green-500/20 text-green-300",
    ],
    gradient: "from-sky-500/10 via-cyan-500/5 to-transparent",
  },
  {
    emoji: "📊",
    icon: FileText,
    title: "Data Summarizer",
    description:
      "Accept raw data as input, process it through a Code node to clean it, then have an LLM produce an executive summary.",
    tags: ["Input", "Code", "LLM"],
    tagColors: [
      "bg-blue-500/20 text-blue-300",
      "bg-rose-600/20 text-rose-300",
      "bg-indigo-500/20 text-indigo-300",
    ],
    gradient: "from-purple-500/10 via-pink-500/5 to-transparent",
  },
  {
    emoji: "🔁",
    icon: RefreshCw,
    title: "Auto-Responder",
    description:
      "Analyse incoming text with a Condition node, route to different LLM prompts, and draft context-aware replies automatically.",
    tags: ["Condition", "LLM", "Output"],
    tagColors: [
      "bg-amber-500/20 text-amber-300",
      "bg-indigo-500/20 text-indigo-300",
      "bg-green-500/20 text-green-300",
    ],
    gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
  },
];

/* ─── Steps ──────────────────────────────────────────────── */
const STEPS = [
  {
    number: "01",
    icon: Layers,
    title: "Design your canvas",
    description:
      "Drag nodes onto an infinite canvas. Each node is a discrete step — an AI call, a code block, an HTTP request, or a branch.",
    color: "text-blue-400",
    glow: "shadow-blue-500/20",
  },
  {
    number: "02",
    icon: GitBranch,
    title: "Connect the dots",
    description:
      "Wire nodes together to define the data flow. Pass outputs from one node as inputs to the next — no code required.",
    color: "text-purple-400",
    glow: "shadow-purple-500/20",
  },
  {
    number: "03",
    icon: Play,
    title: "Run & automate",
    description:
      "Execute your workflow manually, trigger it from chat, or expose it as a tool for your AI agents to invoke automatically.",
    color: "text-green-400",
    glow: "shadow-green-500/20",
  },
];

/* ─── FAQ ────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "What exactly is a workflow?",
    a: "A workflow is a visual automation built by connecting nodes on a canvas. Each node performs one task — calling an AI model, running code, fetching data from an API, or branching based on a condition. Together they form a reusable, automated pipeline.",
  },
  {
    q: "How is this different from just chatting with an AI?",
    a: "Chat is one-shot: you ask, the AI answers. A workflow is repeatable and composable. You define the steps once and run them as many times as you need — with different inputs each time — getting consistent, structured results every run.",
  },
  {
    q: "Do I need to know how to code?",
    a: "No. Most nodes are fully visual. The optional Code node lets you write JavaScript or Python if you want fine-grained control, but you can build powerful workflows entirely without writing a single line of code.",
  },
  {
    q: "Can I share my workflows with my team?",
    a: "Yes. You can set a workflow to Public (anyone with the link can view and run it) or ReadOnly (they can see the structure but not edit). Private keeps it just for you.",
  },
  {
    q: "Which plan do I need to create workflows?",
    a: "Workflow creation requires a Pro or Ultra subscription. Free users can run workflows that have been shared with them. Pro users get up to 5 workflows; Ultra users get unlimited workflows.",
  },
];

/* ─── Tier data ──────────────────────────────────────────── */
const TIERS = [
  {
    name: "Free",
    color: "border-white/10",
    badge: "bg-white/5 text-white/40",
    workflows: "No creation",
    note: "Can run shared workflows",
    cta: "Get Started",
    href: "/sign-in",
    highlight: false,
  },
  {
    name: "Pro",
    color: "border-indigo-500/40",
    badge: "bg-indigo-500/20 text-indigo-300",
    workflows: "Up to 5 workflows",
    note: "Full creation + sharing",
    cta: "Upgrade to Pro",
    href: "/subscription",
    highlight: true,
  },
  {
    name: "Ultra",
    color: "border-purple-500/40",
    badge: "bg-purple-500/20 text-purple-300",
    workflows: "Unlimited workflows",
    note: "Full creation + priority execution",
    cta: "Upgrade to Ultra",
    href: "/subscription",
    highlight: false,
  },
];

/* ─── Animated node canvas (hero) ───────────────────────── */
function AnimatedCanvas() {
  const nodes = [
    { x: 10, y: 30, color: "#3b82f6", label: "Input", delay: 0 },
    { x: 35, y: 15, color: "#6366f1", label: "LLM", delay: 0.2 },
    { x: 35, y: 50, color: "#ec4899", label: "HTTP", delay: 0.15 },
    { x: 62, y: 30, color: "#f59e0b", label: "Condition", delay: 0.3 },
    { x: 85, y: 18, color: "#6366f1", label: "LLM", delay: 0.45 },
    { x: 85, y: 48, color: "#10b981", label: "Output", delay: 0.5 },
  ];
  const edges = [
    { x1: 16, y1: 31, x2: 33, y2: 17 },
    { x1: 16, y1: 32, x2: 33, y2: 51 },
    { x1: 43, y1: 17, x2: 60, y2: 31 },
    { x1: 43, y1: 51, x2: 60, y2: 32 },
    { x1: 70, y1: 30, x2: 83, y2: 19 },
    { x1: 70, y1: 31, x2: 83, y2: 49 },
  ];

  return (
    <div className="relative w-full h-56 md:h-72 select-none pointer-events-none overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 65"
        preserveAspectRatio="none"
      >
        {edges.map((e, i) => (
          <motion.line
            key={i}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.5"
            strokeDasharray="2 2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 + i * 0.1 }}
          />
        ))}
        {/* Animated data dots */}
        {edges.map((e, i) => (
          <motion.circle
            key={`dot-${i}`}
            r="0.8"
            fill="rgba(255,255,255,0.5)"
            initial={{ x: e.x1, y: e.y1, opacity: 0 }}
            animate={{ x: [e.x1, e.x2], y: [e.y1, e.y2], opacity: [0, 1, 0] }}
            transition={{
              duration: 2,
              delay: 1 + i * 0.3,
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
          />
        ))}
      </svg>
      {nodes.map((n, i) => (
        <motion.div
          key={i}
          className="absolute flex flex-col items-center gap-1"
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: n.delay + 0.2 }}
        >
          <div
            className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: n.color + "33",
              border: `1px solid ${n.color}66`,
            }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: n.color }}
            />
          </div>
          <span className="text-[8px] md:text-[9px] text-white/40 font-medium">
            {n.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── FAQ Item ───────────────────────────────────────────── */
function FaqItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: idx * 0.07 }}
      className="border border-white/8 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="text-[15px] font-semibold text-white/90">{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0 ml-4" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-[14px] text-white/40 leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function WorkflowsPage() {
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

      <main className="pt-24">
        {/* ══════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════ */}
        <section className="relative px-6 pt-20 pb-32 flex flex-col items-center text-center overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-[13px] font-medium text-indigo-300"
          >
            <Zap className="w-3.5 h-3.5" />
            Pro &amp; Ultra Feature
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-4xl font-extrabold leading-[1.05] tracking-[-0.04em] mb-6"
            style={{ fontSize: "clamp(40px, 7vw, 96px)" }}
          >
            <span
              style={{
                display: "block",
                background:
                  "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.75) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Automate Anything
            </span>
            <span
              style={{
                display: "block",
                background:
                  "linear-gradient(180deg, rgba(139,92,246,0.9) 0%, rgba(99,102,241,0.6) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              with AI Workflows.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-xl text-[17px] text-white/40 leading-relaxed mb-10"
          >
            Chain AI models, HTTP calls, code blocks, and conditional logic into
            reusable pipelines — visually, without writing boilerplate.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/sign-in"
              className="group inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 rounded-full font-bold text-[15px] hover:bg-white/90 transition-all"
            >
              Start Building Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 border border-white/10 text-white/60 hover:text-white hover:border-white/20 px-7 py-3.5 rounded-full font-medium text-[15px] transition-all"
            >
              See how it works
            </a>
          </motion.div>

          {/* Animated canvas */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full max-w-3xl"
          >
            <AnimatedCanvas />
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="px-6 py-32 bg-[#0a0a0c]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/30 mb-4">
                How It Works
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Three steps to full automation.
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connector lines (desktop) */}
              <div className="hidden md:block absolute top-14 left-[33%] w-[34%] h-px bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-transparent" />
              <div className="hidden md:block absolute top-14 left-[66%] w-[20%] h-px bg-gradient-to-r from-purple-500/40 to-green-500/40" />

              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative flex flex-col gap-5 p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/8 shadow-lg ${step.glow} group-hover:scale-105 transition-transform`}
                  >
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold tracking-widest ${step.color} uppercase`}
                    >
                      {step.number}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[14px] text-white/40 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            NODE TYPES
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 py-32">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/30 mb-4">
                Building Blocks
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
                9 powerful node types.
              </h2>
              <p className="text-white/40 text-lg max-w-xl mx-auto">
                Every node is a self-contained step. Mix and match them to build
                any automation imaginable.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-5">
              {NODE_TYPES.map((node, i) => (
                <motion.div
                  key={node.key}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className={`group relative p-6 rounded-2xl border ${node.border} bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-default`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${node.color} flex items-center justify-center mb-4 shadow-lg ${node.shadow} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <node.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-[15px] font-bold text-white mb-2">
                    {node.key}
                  </h3>
                  <p className="text-[13px] text-white/40 leading-relaxed">
                    {node.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            EXAMPLE WORKFLOWS
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 py-32 bg-[#0a0a0c]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/30 mb-4">
                Templates
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
                Start from a template.
              </h2>
              <p className="text-white/40 text-lg max-w-xl mx-auto">
                Don&apos;t start from scratch. Pick a pre-built example and
                customise it to fit your exact needs.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-6">
              {EXAMPLES.map((ex, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`group relative p-7 rounded-2xl border border-white/8 bg-gradient-to-br ${ex.gradient} hover:border-white/15 transition-all overflow-hidden`}
                >
                  {/* Subtle top-right glow */}
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl" />

                  <div className="text-3xl mb-4">{ex.emoji}</div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {ex.title}
                  </h3>
                  <p className="text-[14px] text-white/40 leading-relaxed mb-5">
                    {ex.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {ex.tags.map((tag, j) => (
                      <span
                        key={j}
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${ex.tagColors[j]}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-10 text-center"
            >
              <Link
                href="/sign-in"
                className="group inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors"
              >
                Sign in to use these templates
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            PRICING CALLOUT
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 py-32">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/30 mb-4">
                Plans
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
                Workflows on every scale.
              </h2>
              <p className="text-white/40 text-lg max-w-lg mx-auto">
                Free users can run shared workflows. Creators need Pro or Ultra.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {TIERS.map((tier, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.12 }}
                  className={`relative p-7 rounded-2xl border ${tier.color} flex flex-col gap-4 ${tier.highlight ? "bg-indigo-500/5" : "bg-white/[0.02]"}`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-500 text-[11px] font-bold text-white tracking-wide">
                      POPULAR
                    </div>
                  )}
                  <span
                    className={`self-start text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${tier.badge}`}
                  >
                    {tier.name}
                  </span>
                  <div>
                    <p className="text-xl font-bold text-white">
                      {tier.workflows}
                    </p>
                    <p className="text-[13px] text-white/40 mt-1">
                      {tier.note}
                    </p>
                  </div>
                  <Link
                    href={tier.href}
                    className={`mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-semibold transition-all ${
                      tier.highlight
                        ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                        : "border border-white/10 text-white/60 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center text-[13px] text-white/25"
            >
              All plans include access to run publicly shared workflows from the
              community.{" "}
              <Link
                href="/subscription"
                className="underline hover:text-white/50 transition-colors"
              >
                View full pricing →
              </Link>
            </motion.p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FEATURE HIGHLIGHTS STRIP
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 py-20 bg-[#0a0a0c] border-y border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                {
                  icon: Globe,
                  label: "Any external API",
                  sub: "HTTP node connects to the world",
                },
                {
                  icon: BotIcon,
                  label: "20+ AI models",
                  sub: "GPT, Claude, Gemini & more",
                },
                {
                  icon: Code2,
                  label: "Custom code",
                  sub: "JS / Python in-workflow",
                },
                {
                  icon: Settings2,
                  label: "Shareable",
                  sub: "Public, read-only, or private",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-white/60" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-white">
                      {item.label}
                    </p>
                    <p className="text-[12px] text-white/35 mt-0.5">
                      {item.sub}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 py-32">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/30 mb-4">
                FAQ
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Common questions.
              </h2>
            </motion.div>

            <div className="flex flex-col gap-3">
              {FAQS.map((faq, i) => (
                <FaqItem key={i} idx={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FOOTER CTA BANNER
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 pb-32">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent p-16 text-center"
            >
              {/* Glow orbs */}
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-600/20 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-8">
                  <Zap className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-5">
                  Ready to automate
                  <br />
                  <span
                    style={{
                      background: "linear-gradient(90deg, #818cf8, #c084fc)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    your work?
                  </span>
                </h2>
                <p className="text-white/40 text-lg mb-10 max-w-md mx-auto">
                  Join thousands of builders using Wasp AI Workflows to ship
                  faster and automate smarter.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/sign-in"
                    className="group inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-[16px] hover:bg-white/90 transition-all"
                  >
                    Start Building Now
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/subscription"
                    className="inline-flex items-center gap-2 border border-white/15 text-white/60 hover:text-white hover:border-white/25 px-8 py-4 rounded-full font-medium text-[16px] transition-all"
                  >
                    View Plans
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Mini footer ── */}
        <div className="border-t border-white/5 px-6 py-8">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-xs font-bold tracking-widest uppercase text-white/30">
              WASPAI
            </span>
            <p className="text-xs text-white/20">
              © 2026 WaspAI Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {[
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
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
      </main>
    </div>
  );
}
