"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
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

/* ─── Agent examples ─────────────────────────────────────── */
const AGENTS = [
  {
    emoji: "🔬",
    name: "Research Analyst",
    role: "Deep Research",
    description:
      "Searches the web, reads full pages, pulls YouTube transcripts, and synthesises a structured research report in minutes.",
    tools: ["Web Search", "Web Scrape", "YouTube", "Memory"],
    gradient: "from-blue-500/15 via-indigo-500/5 to-transparent",
    border: "border-blue-500/20",
    tagColor: "bg-blue-500/15 text-blue-300",
  },
  {
    emoji: "💻",
    name: "Code Reviewer",
    role: "Engineering Assistant",
    description:
      "Reviews code, executes it live in JavaScript or Python, identifies bugs, and suggests fixes with inline explanations.",
    tools: ["JS Execution", "Python", "Web Search", "HTML Preview"],
    gradient: "from-emerald-500/15 via-teal-500/5 to-transparent",
    border: "border-emerald-500/20",
    tagColor: "bg-emerald-500/15 text-emerald-300",
  },
  {
    emoji: "📊",
    name: "Data Analyst",
    role: "Analytics Expert",
    description:
      "Reads CSV files, runs analysis in Python, builds bar, line, and pie charts, then explains the insights in plain English.",
    tools: ["Python", "Bar Chart", "Pie Chart", "CSV Export"],
    gradient: "from-amber-500/15 via-orange-500/5 to-transparent",
    border: "border-amber-500/20",
    tagColor: "bg-amber-500/15 text-amber-300",
  },
  {
    emoji: "📝",
    name: "Content Writer",
    role: "Creative & Marketing",
    description:
      "Drafts blog posts, social copy, and reports — then exports finished content directly to Word, PDF, or Presentation files.",
    tools: ["Word Doc", "PDF", "Presentation", "Web Search"],
    gradient: "from-purple-500/15 via-pink-500/5 to-transparent",
    border: "border-purple-500/20",
    tagColor: "bg-purple-500/15 text-purple-300",
  },
];

/* ─── Tool categories ────────────────────────────────────── */
const TOOL_GROUPS = [
  {
    category: "🌐 Web",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    tools: [
      { icon: Search, name: "Web Search" },
      { icon: Globe, name: "Web Scrape" },
      { icon: Youtube, name: "YouTube Transcript" },
    ],
  },
  {
    category: "💻 Code",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    tools: [
      { icon: Terminal, name: "JavaScript" },
      { icon: Code2, name: "Python" },
      { icon: MonitorPlay, name: "HTML Preview" },
    ],
  },
  {
    category: "🎨 Creative",
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
    tools: [
      { icon: ImageIcon, name: "Image Enhance" },
      { icon: Sparkles, name: "Remove Background" },
      { icon: MonitorPlay, name: "Video Generation" },
    ],
  },
  {
    category: "📄 Files",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    tools: [
      { icon: FileText, name: "PDF / Word" },
      { icon: Database, name: "CSV Export" },
      { icon: QrCode, name: "QR Code" },
    ],
  },
  {
    category: "📧 Communication",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    tools: [
      { icon: Mail, name: "Send Email" },
      { icon: MessageSquare, name: "Temp Email" },
      { icon: Share2, name: "SMS" },
    ],
  },
  {
    category: "🧠 Memory",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    tools: [
      { icon: MemoryStick, name: "Save Memory" },
      { icon: Brain, name: "Recall Memory" },
      { icon: Settings2, name: "Update Memory" },
    ],
  },
  {
    category: "🖥 Browser",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    tools: [
      { icon: Globe, name: "Cloud Browser" },
      { icon: Search, name: "Visual Scrape" },
      { icon: MonitorPlay, name: "Page Interact" },
    ],
  },
  {
    category: "⚙️ Workflows",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
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
      "Give your agent a name, a custom emoji icon with a background colour, and a one-line role title. It feels like a real team member.",
    color: "text-amber-400",
    glow: "bg-amber-500/10 border-amber-500/20",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Instructions",
    description:
      "Write a system prompt that defines exactly how the agent thinks, what it focuses on, and how it responds. Mention other agents or skills inline.",
    color: "text-blue-400",
    glow: "bg-blue-500/10 border-blue-500/20",
  },
  {
    number: "03",
    icon: Wrench,
    title: "Tools",
    description:
      "Arm the agent with any combination of 30+ built-in tools — web search, code execution, image editing, file generation, email, memory, and more.",
    color: "text-emerald-400",
    glow: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    number: "04",
    icon: Workflow,
    title: "Workflows",
    description:
      "Attach your custom Wasp AI Workflows so the agent can trigger full automated pipelines mid-conversation, on demand.",
    color: "text-purple-400",
    glow: "bg-purple-500/10 border-purple-500/20",
  },
];

/* ─── Comparison rows ────────────────────────────────────── */
const COMPARISON = [
  { feature: "Remembers your preferences", chat: false, agent: true },
  { feature: "Custom personality & tone", chat: false, agent: true },
  { feature: "Pre-loaded tools ready to use", chat: false, agent: true },
  { feature: "Can trigger your workflows", chat: false, agent: true },
  { feature: "Shareable with your team", chat: false, agent: true },
  { feature: "One-off questions", chat: true, agent: true },
  { feature: "Multi-model switching", chat: true, agent: true },
];

/* ─── Plans ──────────────────────────────────────────────── */
const PLANS = [
  {
    name: "Free",
    border: "border-white/10",
    badge: "bg-white/5 text-white/40",
    agents: "Limited agent creation",
    note: "Can chat with shared agents",
    cta: "Get Started",
    href: "/sign-in",
    highlight: false,
  },
  {
    name: "Pro",
    border: "border-indigo-500/40",
    badge: "bg-indigo-500/20 text-indigo-300",
    agents: "Full agent creation",
    note: "All tools + workflow triggers",
    cta: "Upgrade to Pro",
    href: "/subscription",
    highlight: true,
  },
  {
    name: "Ultra",
    border: "border-purple-500/40",
    badge: "bg-purple-500/20 text-purple-300",
    agents: "Unlimited agents",
    note: "Priority execution + all features",
    cta: "Upgrade to Ultra",
    href: "/subscription",
    highlight: false,
  },
];

/* ─── FAQs ───────────────────────────────────────────────── */
const FAQS = [
  {
    q: "What's the difference between an agent and a character?",
    a: "Characters are personalities for roleplay or creative chats — they have a persona but limited capabilities. Agents are functional AI assistants: they have tools, memory, workflow triggers, and are built to get real work done.",
  },
  {
    q: "Can agents remember things between chats?",
    a: "Yes. Equip your agent with Memory tools and it will save important facts, preferences, and context across every conversation. The next time you chat, it picks up right where you left off.",
  },
  {
    q: "Can I share an agent with my team?",
    a: "Absolutely. Set an agent's visibility to Public (anyone can chat with it) or ReadOnly (they can see and use it but not edit). Private keeps it just for you.",
  },
  {
    q: "Can an agent run my workflows automatically?",
    a: "Yes — just attach a workflow to the agent during setup. The agent will call that workflow mid-conversation whenever it determines it's needed, passing the right inputs automatically.",
  },
  {
    q: "Can I have multiple agents for different tasks?",
    a: "Yes. Pro users can create up to 5 agents; Ultra users get unlimited. You can have a Research agent, a Coding agent, a Writing agent — each with its own tools, tone, and memory.",
  },
];

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

/* ─── Floating Agent Avatars (hero background) ───────────── */
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
          className={`absolute ${item.size} rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xl backdrop-blur-sm`}
          style={{ left: item.x, top: item.y }}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{
            opacity: [0, 0.7, 0.5, 0.7],
            scale: 1,
            y: [20, 0, -8, 0],
          }}
          transition={{
            duration: 4,
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

/* ─── Page ───────────────────────────────────────────────── */
export default function AiAgentsPage() {
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
        <section className="relative px-6 pt-20 pb-36 flex flex-col items-center text-center overflow-hidden min-h-[680px]">
          {/* Background glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />

          <FloatingAgents />

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-[13px] font-medium text-violet-300"
            >
              <Bot className="w-3.5 h-3.5" />
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
                Your AI. Your Rules.
              </span>
              <span
                style={{
                  display: "block",
                  background:
                    "linear-gradient(180deg, rgba(167,139,250,0.95) 0%, rgba(139,92,246,0.65) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Your Agents.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-xl text-[17px] text-white/40 leading-relaxed mb-10"
            >
              Build specialised AI assistants with custom identities,
              instructions, 30+ tools, and the power to trigger your own
              workflows — all from a single chat.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                href="/sign-in"
                className="group inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 rounded-full font-bold text-[15px] hover:bg-white/90 transition-all"
              >
                Create Your First Agent
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#examples"
                className="inline-flex items-center gap-2 border border-white/10 text-white/60 hover:text-white hover:border-white/20 px-7 py-3.5 rounded-full font-medium text-[15px] transition-all"
              >
                See examples
              </a>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            4 LAYERS
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
                How Agents Work
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
                Built in four layers.
              </h2>
              <p className="text-white/40 text-lg max-w-xl mx-auto">
                Every agent is made of four components that work together to
                create a truly intelligent, purposeful assistant.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {LAYERS.map((layer, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className={`relative p-7 rounded-2xl border ${layer.glow} flex flex-col gap-4 group hover:scale-[1.02] transition-transform duration-300`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl ${layer.glow} border flex items-center justify-center`}
                  >
                    <layer.icon className={`w-5 h-5 ${layer.color}`} />
                  </div>
                  <span
                    className={`text-xs font-black tracking-widest uppercase ${layer.color}`}
                  >
                    {layer.number}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {layer.title}
                    </h3>
                    <p className="text-[13px] text-white/40 leading-relaxed">
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
        <section className="px-6 py-32">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/30 mb-4">
                Tool Arsenal
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
                30+ tools at your agent&apos;s fingertips.
              </h2>
              <p className="text-white/40 text-lg max-w-xl mx-auto">
                Arm your agent with exactly what it needs. Mix and match from 8
                categories of powerful capabilities.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {TOOL_GROUPS.map((group, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className={`p-6 rounded-2xl border ${group.bg} group hover:scale-[1.02] transition-transform duration-300`}
                >
                  <h3
                    className={`text-[13px] font-black uppercase tracking-widest mb-5 ${group.color}`}
                  >
                    {group.category}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {group.tools.map((tool, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <tool.icon className="w-3.5 h-3.5 text-white/50" />
                        </div>
                        <span className="text-[13px] text-white/60 font-medium">
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

        {/* ══════════════════════════════════════════════════════
            AGENT EXAMPLES
        ══════════════════════════════════════════════════════ */}
        <section id="examples" className="px-6 py-32 bg-[#0a0a0c]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/30 mb-4">
                Inspiration
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
                Agents people actually build.
              </h2>
              <p className="text-white/40 text-lg max-w-xl mx-auto">
                These are just starting points. Your agent can be anything you
                need it to be.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-6">
              {AGENTS.map((agent, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`relative p-7 rounded-2xl border ${agent.border} bg-gradient-to-br ${agent.gradient} hover:scale-[1.01] transition-transform duration-300 overflow-hidden`}
                >
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {agent.emoji}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {agent.name}
                      </h3>
                      <p className="text-xs text-white/40 font-medium uppercase tracking-wider">
                        {agent.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-[14px] text-white/40 leading-relaxed mb-5">
                    {agent.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {agent.tools.map((tool, j) => (
                      <span
                        key={j}
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${agent.tagColor}`}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-10 text-center"
            >
              <Link
                href="/sign-in"
                className="group inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors"
              >
                Sign in to build your own agent
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            AGENTS vs. CHAT COMPARISON
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
                Comparison
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
                Chat is great. Agents are better.
              </h2>
              <p className="text-white/40 text-lg max-w-md mx-auto">
                See exactly where agents unlock capabilities that plain chat
                conversations can&apos;t match.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-white/8 overflow-hidden"
            >
              {/* Header */}
              <div className="grid grid-cols-3 border-b border-white/8 bg-white/[0.02]">
                <div className="px-6 py-4 text-[13px] font-bold text-white/40 uppercase tracking-widest">
                  Feature
                </div>
                <div className="px-6 py-4 text-[13px] font-bold text-white/60 uppercase tracking-widest text-center border-l border-white/8">
                  Plain Chat
                </div>
                <div className="px-6 py-4 text-[13px] font-bold text-violet-400 uppercase tracking-widest text-center border-l border-white/8">
                  Agent
                </div>
              </div>
              {/* Rows */}
              {COMPARISON.map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="grid grid-cols-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="px-6 py-4 text-[14px] text-white/60 font-medium">
                    {row.feature}
                  </div>
                  <div className="px-6 py-4 flex items-center justify-center border-l border-white/5">
                    {row.chat ? (
                      <span className="text-emerald-400 text-lg">✓</span>
                    ) : (
                      <span className="text-white/15 text-lg">✕</span>
                    )}
                  </div>
                  <div className="px-6 py-4 flex items-center justify-center border-l border-white/5">
                    {row.agent ? (
                      <span className="text-violet-400 text-lg">✓</span>
                    ) : (
                      <span className="text-white/15 text-lg">✕</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            PLAN COMPARISON
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 py-32 bg-[#0a0a0c]">
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
                Pick your power level.
              </h2>
              <p className="text-white/40 text-lg max-w-lg mx-auto">
                Free users can chat with shared agents. Creators need Pro or
                Ultra.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {PLANS.map((plan, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.12 }}
                  className={`relative p-7 rounded-2xl border ${plan.border} flex flex-col gap-4 ${plan.highlight ? "bg-indigo-500/5" : "bg-white/[0.02]"}`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-500 text-[11px] font-bold text-white tracking-wide">
                      POPULAR
                    </div>
                  )}
                  <span
                    className={`self-start text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${plan.badge}`}
                  >
                    {plan.name}
                  </span>
                  <div>
                    <p className="text-xl font-bold text-white">
                      {plan.agents}
                    </p>
                    <p className="text-[13px] text-white/40 mt-1">
                      {plan.note}
                    </p>
                  </div>
                  <Link
                    href={plan.href}
                    className={`mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-semibold transition-all ${
                      plan.highlight
                        ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                        : "border border-white/10 text-white/60 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {plan.cta}
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
              All plans can chat with publicly shared agents.{" "}
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
            CTA BANNER
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 pb-32">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-transparent p-16 text-center"
            >
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-violet-600/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/30 mb-8">
                  <Bot className="w-8 h-8 text-violet-400" />
                </div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-5">
                  Build your first agent
                  <br />
                  <span
                    style={{
                      background: "linear-gradient(90deg, #a78bfa, #818cf8)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    in 60 seconds.
                  </span>
                </h2>
                <p className="text-white/40 text-lg mb-10 max-w-md mx-auto">
                  Give it a name, write its instructions, pick its tools.
                  That&apos;s all it takes to have a custom AI working for you.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/sign-in"
                    className="group inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-[16px] hover:bg-white/90 transition-all"
                  >
                    Create an Agent Now
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/workflows"
                    className="inline-flex items-center gap-2 border border-white/15 text-white/60 hover:text-white hover:border-white/25 px-8 py-4 rounded-full font-medium text-[16px] transition-all"
                  >
                    Explore Workflows
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
                { label: "Workflows", href: "/workflows" },
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
