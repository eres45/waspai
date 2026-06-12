"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/landing/footer";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Brain,
  ChevronDown,
  Code2,
  FileText,
  Globe,
  ImageIcon,
  Mail,
  MemoryStick,
  MessageSquare,
  MonitorPlay,
  Settings2,
  Share2,
  Sparkles,
  Terminal,
  Workflow,
  Wrench,
  Zap,
  Search,
  Youtube,
  QrCode,
  Database,
  Layers,
} from "lucide-react";

/* ─── Agent examples (Clean, Uniform Data) ───────────────── */
const AGENTS = [
  {
    emoji: "🔬",
    name: "Research Analyst",
    role: "Deep Research",
    description:
      "Searches the web, scrapes target documents, extracts YouTube video transcripts, and structures comprehensive markdown reports.",
    tools: ["Web Search", "Web Scrape", "YouTube", "Memory"],
  },
  {
    emoji: "💻",
    name: "Code Reviewer",
    role: "Engineering Assistant",
    description:
      "Inspects source code, runs executions live in sandbox JavaScript/Python layers, detects errors, and outputs contextual diffs.",
    tools: ["JS Execution", "Python", "Web Search", "HTML Preview"],
  },
  {
    emoji: "📊",
    name: "Data Analyst",
    role: "Analytics Expert",
    description:
      "Ingests CSV records, calculates aggregates via custom Python execution, plots data trends, and summarizes quantitative insights.",
    tools: ["Python", "Bar Chart", "Pie Chart", "CSV Export"],
  },
  {
    emoji: "📝",
    name: "Content Writer",
    role: "Creative & Marketing",
    description:
      "Generates marketing materials, copy drafts, and documentation templates — then exports the outputs directly into Word or PDF.",
    tools: ["Word Doc", "PDF", "Presentation", "Web Search"],
  },
];

/* ─── Tool categories (Unified styling tags) ─────────────── */
const TOOL_GROUPS = [
  {
    category: "🌐 Web Integration",
    tools: [
      { icon: Search, name: "Web Search" },
      { icon: Globe, name: "Web Scrape" },
      { icon: Youtube, name: "YouTube Transcript" },
    ],
  },
  {
    category: "💻 Code Execution",
    tools: [
      { icon: Terminal, name: "JavaScript" },
      { icon: Code2, name: "Python" },
      { icon: MonitorPlay, name: "HTML Preview" },
    ],
  },
  {
    category: "🎨 Creative Tools",
    tools: [
      { icon: ImageIcon, name: "Image Enhance" },
      { icon: Sparkles, name: "Remove Background" },
      { icon: MonitorPlay, name: "Video Generation" },
    ],
  },
  {
    category: "📄 File Suite",
    tools: [
      { icon: FileText, name: "PDF / Word" },
      { icon: Database, name: "CSV Export" },
      { icon: QrCode, name: "QR Code" },
    ],
  },
  {
    category: "📧 Communication",
    tools: [
      { icon: Mail, name: "Send Email" },
      { icon: MessageSquare, name: "Temp Email" },
      { icon: Share2, name: "SMS Numbers" },
    ],
  },
  {
    category: "🧠 Profile Memory",
    tools: [
      { icon: MemoryStick, name: "Save Memory" },
      { icon: Brain, name: "Recall Memory" },
      { icon: Settings2, name: "Update Memory" },
    ],
  },
  {
    category: "🖥 Cloud Browser",
    tools: [
      { icon: Globe, name: "Cloud Browser" },
      { icon: Search, name: "Visual Scrape" },
      { icon: MonitorPlay, name: "Page Interact" },
    ],
  },
  {
    category: "⚙️ Custom Workflows",
    tools: [
      { icon: Workflow, name: "Run Workflow" },
      { icon: Layers, name: "Chain Steps" },
      { icon: Zap, name: "Auto-trigger" },
    ],
  },
];

/* ─── 4 Layers ───────────────────────────────────────────── */
const LAYERS = [
  {
    number: "01",
    icon: Sparkles,
    title: "Identity",
    description:
      "Define your agent name, character emoji, and primary role title to introduce a structured teammate into your workspace.",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Instructions",
    description:
      "Write a specialized system prompt configuring exactly how the agent evaluates problems, files, and queries.",
  },
  {
    number: "03",
    icon: Wrench,
    title: "Tools",
    description:
      "Grant permission to utilize 30+ native tools including code runtimes, file outputs, browser nodes, and persistent memory states.",
  },
  {
    number: "04",
    icon: Workflow,
    title: "Workflows",
    description:
      "Attach custom node canvas workflows so the agent can execute multi-step automated sequences autonomously.",
  },
];

/* ─── Comparison rows ────────────────────────────────────── */
const COMPARISON = [
  {
    feature: "Remembers preferences across sessions",
    chat: false,
    agent: true,
  },
  {
    feature: "Custom instructions & operational tone",
    chat: false,
    agent: true,
  },
  {
    feature: "Access to 30+ pre-configured workspace tools",
    chat: false,
    agent: true,
  },
  {
    feature: "Trigger multi-node workflows mid-chat",
    chat: false,
    agent: true,
  },
  { feature: "Shareable via link with teammates", chat: false, agent: true },
  { feature: "One-off generic model queries", chat: true, agent: true },
  { feature: "Real-time model swapping in-flight", chat: true, agent: true },
];

/* ─── FAQs ───────────────────────────────────────────────── */
const FAQS = [
  {
    q: "What is an AI Agent?",
    a: "An AI Agent is a customized assistant equipped with system prompts, memory integrations, and a specific set of tools. They can operate independently to research, compute, execute scripts, and trigger automations.",
  },
  {
    q: "Can agents remember context across conversations?",
    a: "Yes. Using memory tools, an agent saves user preferences, decisions, and files. They will recall this information in future chats without needing you to restate it.",
  },
  {
    q: "Can I share agents with others?",
    a: "Yes. You can publish your custom agents to the community, share read-only links with teammates, or keep them completely private to your account.",
  },
  {
    q: "How do agents trigger workflows?",
    a: "By attaching a custom workflow to your agent, the assistant will automatically parse your prompt requests and trigger the sequence when appropriate, passing arguments on your behalf.",
  },
  {
    q: "How many agents can I create?",
    a: "Free accounts can create a limited number of agents. Pro users can build up to 5 agents, while Ultra tier accounts have access to unlimited agent creations.",
  },
];

/* ─── FAQ Item ───────────────────────────────────────────── */
function FaqItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: idx * 0.05 }}
      className="border border-white/5 bg-[#121214] rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-semibold text-white/90">{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-white/30" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm text-neutral-400 leading-relaxed font-light">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Floating Agent Emojis (Monochrome Cards) ───────────── */
function FloatingAgents() {
  const items = [
    { emoji: "🔬", x: "8%", y: "20%", delay: 0, size: "w-14 h-14" },
    { emoji: "💻", x: "82%", y: "15%", delay: 0.3, size: "w-12 h-12" },
    { emoji: "📊", x: "75%", y: "65%", delay: 0.6, size: "w-16 h-16" },
    { emoji: "📝", x: "5%", y: "70%", delay: 0.2, size: "w-10 h-10" },
    { emoji: "🤖", x: "50%", y: "8%", delay: 0.4, size: "w-10 h-10" },
    { emoji: "🧑‍💻", x: "90%", y: "45%", delay: 0.5, size: "w-11 h-11" },
    { emoji: "🧠", x: "15%", y: "48%", delay: 0.1, size: "w-9 h-9" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((item, i) => (
        <motion.div
          key={i}
          className={`absolute ${item.size} rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-xl backdrop-blur-sm shadow-xl`}
          style={{ left: item.x, top: item.y }}
          initial={{ opacity: 0, scale: 0.85, y: 15 }}
          animate={{
            opacity: [0, 0.6, 0.4, 0.6],
            scale: 1,
            y: [15, 0, -6, 0],
          }}
          transition={{
            duration: 4.5,
            delay: item.delay,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </div>
  );
}

export default function AiAgentsPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white selection:bg-purple-500/20 overflow-x-hidden font-sans antialiased">
      {/* Top Fixed Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0f]/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-all duration-300">
              W
            </div>
            <span className="font-bold tracking-tight text-white group-hover:text-purple-400 transition-colors">
              WASPAI
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/sign-in"
              className="text-sm bg-white text-black hover:bg-white/90 font-semibold px-4 py-1.5 rounded-lg transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* ══════════════════════════════════════════════════════
            HERO SECTION
        ══════════════════════════════════════════════════════ */}
        <section className="relative px-6 pt-24 pb-36 flex flex-col items-center text-center overflow-hidden min-h-[640px]">
          {/* Faint ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-purple-600/[0.03] rounded-full blur-[100px] pointer-events-none" />

          <FloatingAgents />

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/15 bg-purple-500/5 px-4.5 py-1 text-[13px] font-medium text-purple-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
            >
              <Bot className="w-3.5 h-3.5" />
              Pro &amp; Ultra Feature
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-4xl font-extrabold leading-[1.08] tracking-[-0.03em] mb-6"
              style={{ fontSize: "clamp(38px, 6.5vw, 84px)" }}
            >
              <span className="block bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
                Your AI. Your Rules.
              </span>
              <span className="block bg-gradient-to-b from-white/60 to-white/20 bg-clip-text text-transparent">
                Your Agents.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-lg text-[16px] text-neutral-400 font-light leading-relaxed mb-10"
            >
              Build specialized AI assistants configured with custom system
              prompts, persistent memory nodes, and workflows to automate daily
              workflows.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                href="/sign-in"
                className="group inline-flex items-center gap-1.5 bg-white text-black px-6 py-3 rounded-lg font-semibold text-[14px] hover:bg-white/90 transition-all shadow-lg"
              >
                Create Your First Agent
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#examples"
                className="inline-flex items-center border border-white/5 bg-[#161618] hover:bg-[#1c1c1f] hover:border-white/10 text-neutral-300 px-6 py-3 rounded-lg font-medium text-[14px] transition-all"
              >
                Explore Presets
              </a>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            4 LAYERS
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 py-28 border-y border-white/5 bg-[#0d0d0f] relative">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3 font-mono">
                System Structure
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                Built in four layers
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {LAYERS.map((layer, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex flex-col gap-4 p-6.5 rounded-xl border border-white/5 bg-[#121214] hover:border-white/10 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-purple-300">
                    <layer.icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-neutral-500 tracking-wider">
                      LAYER {layer.number}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1 mb-2">
                      {layer.title}
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed font-light">
                      {layer.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            TOOL ARSENAL
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 py-28 bg-[#0d0d0f]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3 font-mono">
                Integrations Library
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent mb-4">
                30+ tools for your agents
              </h2>
              <p className="text-neutral-400 text-sm md:text-base font-light max-w-md mx-auto">
                Arm your custom assistant configurations with standard
                operational tooling modules.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {TOOL_GROUPS.map((group, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="p-6 rounded-xl border border-white/5 bg-[#121214] hover:border-white/10 transition-all duration-200"
                >
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400 mb-5">
                    {group.category}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {group.tools.map((tool, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 text-neutral-400">
                          <tool.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs text-neutral-300 font-medium">
                          {tool.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Agent Examples (Unified Blueprint Style) ── */}
        <section
          id="examples"
          className="px-6 py-28 border-t border-white/5 bg-[#121214]"
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3 font-mono">
                Preset Personas
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent mb-4">
                Pre-configured Agent layouts
              </h2>
              <p className="text-neutral-400 text-sm md:text-base font-light max-w-md mx-auto">
                Review structures configured by other developers to solve
                analytical, creative, and code tasks.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              {AGENTS.map((agent, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="group relative p-6.5 rounded-xl border border-white/5 bg-[#0d0d0f] hover:border-white/10 transition-all duration-200"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
                      {agent.emoji}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {agent.name}
                      </h3>
                      <p className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                        {agent.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-[13px] text-neutral-400 leading-relaxed font-light mb-4">
                    {agent.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.tools.map((tool, j) => (
                      <span
                        key={j}
                        className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-neutral-400"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-10 text-center"
            >
              <Link
                href="/sign-in"
                className="group inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-white transition-colors"
              >
                Sign in to customize templates
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── Comparison Table (Neutral Slate Style) ── */}
        <section className="px-6 py-28 bg-[#0d0d0f]">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3 font-mono">
                Capability comparison
              </p>
              <h2 className="text-3xl font-bold bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                Chat vs Agents
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-white/5 bg-[#121214] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="grid grid-cols-3 border-b border-white/5 bg-white/[0.01]">
                <div className="px-6 py-4 text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
                  Feature
                </div>
                <div className="px-6 py-4 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest text-center border-l border-white/5">
                  Plain Chat
                </div>
                <div className="px-6 py-4 text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest text-center border-l border-white/5">
                  AI Agent
                </div>
              </div>
              {/* Rows */}
              {COMPARISON.map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-3 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors"
                >
                  <div className="px-6 py-4 text-xs sm:text-sm text-neutral-300 font-light">
                    {row.feature}
                  </div>
                  <div className="px-6 py-4 flex items-center justify-center border-l border-white/5 text-xs">
                    {row.chat ? (
                      <span className="text-emerald-400 font-bold">✓</span>
                    ) : (
                      <span className="text-neutral-600 font-bold">✕</span>
                    )}
                  </div>
                  <div className="px-6 py-4 flex items-center justify-center border-l border-white/5 text-xs">
                    {row.agent ? (
                      <span className="text-purple-400 font-bold">✓</span>
                    ) : (
                      <span className="text-neutral-600 font-bold">✕</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 py-28 bg-[#0d0d0f]">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3 font-mono">
                Common Questions
              </p>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                Agent FAQ
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
            CTA BANNER
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 pb-28 bg-[#0d0d0f]">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#121214] p-12 md:p-16 text-center"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_0%,transparent_70%)]" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 text-purple-300">
                  <Bot className="w-5 h-5" />
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent mb-4">
                  Deploy custom agents.
                </h2>
                <p className="text-neutral-400 text-sm md:text-base font-light mb-8 max-w-sm">
                  Introduce autonomous, tool-armed AI assistants to your Wasp AI
                  chats.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/sign-in"
                    className="group inline-flex items-center gap-1.5 bg-white text-black px-6 py-3 rounded-lg font-semibold text-xs hover:bg-white/90 transition-all"
                  >
                    Build an Agent
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/subscription"
                    className="inline-flex items-center border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] text-neutral-300 px-6 py-3 rounded-lg font-semibold text-xs transition-all"
                  >
                    Compare Plans
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
