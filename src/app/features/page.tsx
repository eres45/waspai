"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Brain,
  ChevronDown,
  Code2,
  FileText,
  Globe,
  ImageIcon,
  Layers,
  Mail,
  MemoryStick,
  MessageSquare,
  MonitorPlay,
  QrCode,
  Search,
  Settings2,
  Sparkles,
  Terminal,
  VideoIcon,
  Workflow,
  Wrench,
  Zap,
  SplitIcon,
  Database,
  Shield,
  Cpu,
  PenTool,
  Share2,
} from "lucide-react";

/* ─── Feature categories (hero stat bar) ─────────────────── */
const STATS = [
  { value: "20+", label: "AI Models" },
  { value: "30+", label: "Built-in Tools" },
  { value: "9", label: "Workflow Nodes" },
  { value: "∞", label: "Possibilities" },
];

/* ─── All features grouped ───────────────────────────────── */
const FEATURE_GROUPS = [
  {
    id: "ai-models",
    category: "🤖 AI Models",
    headline: "Every top model. One interface.",
    subhead:
      "Stop switching between apps. Access GPT, Claude, Gemini, Grok, DeepSeek, Mistral, Llama and 20+ models from one unified chat experience.",
    color: "indigo",
    gradient: "from-indigo-500/15 via-blue-500/5 to-transparent",
    border: "border-indigo-500/20",
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/15 border-indigo-500/25",
    icon: Cpu,
    features: [
      {
        icon: MessageSquare,
        title: "GPT-4o / GPT-5",
        desc: "OpenAI's latest flagship — the best at reasoning, coding, and conversation.",
      },
      {
        icon: Sparkles,
        title: "Claude Sonnet & Opus",
        desc: "Anthropic's thoughtful models — superb at writing, analysis, and long docs.",
      },
      {
        icon: Brain,
        title: "Gemini 2.5 Pro & Flash",
        desc: "Google's multimodal models — great with images, audio, and massive context.",
      },
      {
        icon: Zap,
        title: "Grok 3 & DeepSearch",
        desc: "xAI's model with real-time web access and uncensored responses.",
      },
      {
        icon: Code2,
        title: "DeepSeek V3",
        desc: "Blazing-fast open-source model tuned for code and structured reasoning.",
      },
      {
        icon: Layers,
        title: "Llama 4 & Mistral",
        desc: "Lightweight open models — fast, private, and cost-efficient.",
      },
    ],
  },
  {
    id: "agents",
    category: "🧑‍💼 AI Agents",
    headline: "Custom agents built for your work.",
    subhead:
      "Create specialised AI assistants with a name, emoji, system prompt, and a full toolkit. Attach workflows for end-to-end automation.",
    color: "violet",
    gradient: "from-violet-500/15 via-purple-500/5 to-transparent",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/15 border-violet-500/25",
    icon: Bot,
    features: [
      {
        icon: Sparkles,
        title: "Custom Identity",
        desc: "Name, emoji icon, colour, and a one-line role — feels like a real team member.",
      },
      {
        icon: MessageSquare,
        title: "System Prompts",
        desc: "Write precise instructions that shape how the agent thinks and responds.",
      },
      {
        icon: Wrench,
        title: "Tool Access",
        desc: "Arm agents with any of 30+ tools — web search, code, email, memory, and more.",
      },
      {
        icon: Workflow,
        title: "Workflow Triggers",
        desc: "Agents can invoke your custom workflows mid-conversation, automatically.",
      },
      {
        icon: Share2,
        title: "Shareable Agents",
        desc: "Share agents with your team via public or read-only links.",
      },
      {
        icon: MemoryStick,
        title: "Persistent Memory",
        desc: "Agents remember facts across every chat — no need to repeat yourself.",
      },
    ],
  },
  {
    id: "workflows",
    category: "⚙️ Workflows",
    headline: "Visual automation for any process.",
    subhead:
      "Chain AI models, HTTP calls, code blocks, and conditional logic into reusable no-code pipelines on an infinite canvas.",
    color: "emerald",
    gradient: "from-emerald-500/15 via-teal-500/5 to-transparent",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15 border-emerald-500/25",
    icon: Workflow,
    features: [
      {
        icon: Layers,
        title: "Visual Canvas",
        desc: "Drag, drop, and wire nodes on an infinite canvas — no boilerplate required.",
      },
      {
        icon: Bot,
        title: "LLM Node",
        desc: "Call any AI model with a custom prompt and receive structured output.",
      },
      {
        icon: Globe,
        title: "HTTP Node",
        desc: "Fetch any external REST API — weather, databases, webhooks, and more.",
      },
      {
        icon: SplitIcon,
        title: "Condition Node",
        desc: "Branch your flow with if/else logic based on any output value.",
      },
      {
        icon: Terminal,
        title: "Code Node",
        desc: "Write custom JavaScript or Python logic for advanced transformations.",
      },
      {
        icon: Share2,
        title: "Shareable",
        desc: "Publish workflows publicly or share read-only links with teammates.",
      },
    ],
  },
  {
    id: "image",
    category: "🎨 Image Generation & Editing",
    headline: "Create. Edit. Transform. Instantly.",
    subhead:
      "Generate stunning images with Flux and Stable Diffusion, then edit them with 8 professional AI tools — all without leaving the chat.",
    color: "pink",
    gradient: "from-pink-500/15 via-rose-500/5 to-transparent",
    border: "border-pink-500/20",
    iconColor: "text-pink-400",
    iconBg: "bg-pink-500/15 border-pink-500/25",
    icon: ImageIcon,
    features: [
      {
        icon: Sparkles,
        title: "Image Generation",
        desc: "Flux, Stable Diffusion, and Midjourney-grade quality from text prompts.",
      },
      {
        icon: ImageIcon,
        title: "Remove Background",
        desc: "One-click background removal with pixel-perfect edge detection.",
      },
      {
        icon: PenTool,
        title: "Enhance Image",
        desc: "AI upscaling and quality enhancement for any image.",
      },
      {
        icon: Sparkles,
        title: "Anime Conversion",
        desc: "Convert photos to anime-style art with a single command.",
      },
      {
        icon: ImageIcon,
        title: "Remove Object",
        desc: "Erase anything from a photo and fill intelligently.",
      },
      {
        icon: Zap,
        title: "Super Resolution",
        desc: "Upscale images up to 4× without losing detail.",
      },
    ],
  },
  {
    id: "code",
    category: "💻 Code Execution",
    headline: "Write, run, and debug in real time.",
    subhead:
      "Execute JavaScript and Python in a live sandbox. Build data pipelines, run scripts, render HTML previews — directly in your chat.",
    color: "amber",
    gradient: "from-amber-500/15 via-orange-500/5 to-transparent",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15 border-amber-500/25",
    icon: Code2,
    features: [
      {
        icon: Terminal,
        title: "JavaScript Executor",
        desc: "Run JS in a live sandbox — perfect for quick computations and prototyping.",
      },
      {
        icon: Code2,
        title: "Python Executor",
        desc: "Execute Python scripts with data science libraries for analysis and scripting.",
      },
      {
        icon: MonitorPlay,
        title: "HTML Preview",
        desc: "Render full HTML/CSS/JS apps live directly inside the chat window.",
      },
      {
        icon: Globe,
        title: "HTTP Fetch",
        desc: "Make fetch requests to external APIs and inspect structured responses.",
      },
      {
        icon: Settings2,
        title: "Custom Logic",
        desc: "Chain code execution with AI calls for hybrid intelligent pipelines.",
      },
      {
        icon: Zap,
        title: "Rapid Prototyping",
        desc: "Build, test, iterate — faster than any traditional IDE workflow.",
      },
    ],
  },
  {
    id: "files",
    category: "📄 File Generation",
    headline: "Create any document with a prompt.",
    subhead:
      "Generate Word documents, PDFs, PowerPoint presentations, CSVs, text files, and QR codes — then download instantly.",
    color: "blue",
    gradient: "from-blue-500/15 via-sky-500/5 to-transparent",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/15 border-blue-500/25",
    icon: FileText,
    features: [
      {
        icon: FileText,
        title: "Word Documents",
        desc: "Generate fully formatted .docx files from any prompt or data.",
      },
      {
        icon: FileText,
        title: "PDF Reports",
        desc: "Create professional PDFs with headers, tables, and styled content.",
      },
      {
        icon: Layers,
        title: "Presentations",
        desc: "Build PowerPoint-compatible slide decks with structured layouts.",
      },
      {
        icon: Database,
        title: "CSV Export",
        desc: "Tabular data, analysis results, or scraped content — exported as CSV.",
      },
      {
        icon: QrCode,
        title: "QR Code Generator",
        desc: "Generate QR codes (with or without logo) for any URL or text.",
      },
      {
        icon: Settings2,
        title: "File Converter",
        desc: "Convert between file formats — PDF to text, PPT to data, and more.",
      },
    ],
  },
  {
    id: "web",
    category: "🌐 Web & Research",
    headline: "The whole web at your AI's fingertips.",
    subhead:
      "Search the live web, scrape pages, fetch YouTube transcripts, and browse interactively with a cloud browser — all from chat.",
    color: "cyan",
    gradient: "from-cyan-500/15 via-blue-500/5 to-transparent",
    border: "border-cyan-500/20",
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/15 border-cyan-500/25",
    icon: Globe,
    features: [
      {
        icon: Search,
        title: "Web Search",
        desc: "Real-time search — always up to date, never limited to training data.",
      },
      {
        icon: Globe,
        title: "Web Scraping",
        desc: "Extract structured data from any public website on demand.",
      },
      {
        icon: MonitorPlay,
        title: "YouTube Transcript",
        desc: "Pull full transcripts from any YouTube video and summarise them instantly.",
      },
      {
        icon: Globe,
        title: "Cloud Browser",
        desc: "Interact with websites visually — click, scroll, fill forms, screenshot.",
      },
      {
        icon: Globe,
        title: "HTTP Tool",
        desc: "Make API calls to any REST endpoint directly from your chat.",
      },
      {
        icon: Search,
        title: "Deep Research",
        desc: "Chain search → read → summarise into one fully automated research report.",
      },
    ],
  },
  {
    id: "memory",
    category: "🧠 Memory & Personalisation",
    headline: "AI that remembers who you are.",
    subhead:
      "Save preferences, past decisions, and key facts so every conversation builds on the last. No more repeating yourself.",
    color: "rose",
    gradient: "from-rose-500/15 via-pink-500/5 to-transparent",
    border: "border-rose-500/20",
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/15 border-rose-500/25",
    icon: Brain,
    features: [
      {
        icon: MemoryStick,
        title: "Save Memory",
        desc: "Explicitly store important facts — the AI will recall them in future chats.",
      },
      {
        icon: Brain,
        title: "Auto-Recall",
        desc: "Memories surface automatically when they're relevant to the conversation.",
      },
      {
        icon: Settings2,
        title: "Update Memory",
        desc: "Edit or update stored facts as your preferences change over time.",
      },
      {
        icon: MemoryStick,
        title: "Delete Memory",
        desc: "Remove any stored information at any time — you stay in full control.",
      },
      {
        icon: Shield,
        title: "Private by Default",
        desc: "Memories are tied to your account only — never shared without consent.",
      },
      {
        icon: Zap,
        title: "Cross-Session",
        desc: "Works across every chat, every agent, every session — seamlessly.",
      },
    ],
  },
  {
    id: "communication",
    category: "📧 Communication Tools",
    headline: "Send emails and messages, right from chat.",
    subhead:
      "Draft, send, and receive emails and SMS directly through your AI. Temp email inboxes, real SMTP sending, and SMS — all built in.",
    color: "teal",
    gradient: "from-teal-500/15 via-emerald-500/5 to-transparent",
    border: "border-teal-500/20",
    iconColor: "text-teal-400",
    iconBg: "bg-teal-500/15 border-teal-500/25",
    icon: Mail,
    features: [
      {
        icon: Mail,
        title: "Send Email",
        desc: "Draft and send real emails through AI — copy, newsletters, outreach.",
      },
      {
        icon: Mail,
        title: "Temp Email",
        desc: "Create a disposable inbox instantly for signups or testing.",
      },
      {
        icon: MessageSquare,
        title: "Read Emails",
        desc: "Check and summarise messages from your temp inbox automatically.",
      },
      {
        icon: Share2,
        title: "SMS Numbers",
        desc: "List available SMS numbers and receive text messages via AI.",
      },
      {
        icon: MessageSquare,
        title: "Get SMS",
        desc: "Read incoming SMS messages through your AI assistant in real time.",
      },
      {
        icon: Zap,
        title: "Automated Outreach",
        desc: "Combine with workflows for fully automated multi-step email sequences.",
      },
    ],
  },
];

/* ─── Full feature count strip ───────────────────────────── */
const QUICK_FEATURES = [
  { icon: VideoIcon, label: "Video Generation" },
  { icon: MonitorPlay, label: "Cloud Browser" },
  { icon: Share2, label: "Site Deployment" },
  { icon: Sparkles, label: "Image Analysis" },
  { icon: MessageSquare, label: "MCP Protocol" },
  { icon: Brain, label: "Sequential Thinking" },
  { icon: Settings2, label: "Skills / Presets" },
  { icon: FileText, label: "Export Chat" },
];

/* ─── FAQ ────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "Do I need to know how to code to use Wasp AI?",
    a: "No. Every feature is designed for a natural language interface. You describe what you want and Wasp AI uses the right tools automatically. The code execution and HTTP tools are optional power-user features.",
  },
  {
    q: "Which AI models are available?",
    a: "We support 20+ models including GPT-4o, GPT-5, Claude Sonnet and Opus, Gemini 2.5 Pro and Flash, Grok 3, DeepSeek V3, Llama 4, Mistral Large, and more. New models are added regularly.",
  },
  {
    q: "Can I switch models mid-conversation?",
    a: "Yes. You can switch the active model at any point in a conversation. Each message can use a different model if you prefer.",
  },
  {
    q: "Are my files and conversations private?",
    a: "Yes. Your conversations, memories, agents, and workflows are private by default. You choose what to make public or share with others.",
  },
  {
    q: "What's the difference between an agent, a workflow, and a skill?",
    a: "An Agent is a persistent AI persona with tools and memory. A Workflow is a visual automation pipeline you build once and run repeatedly. A Skill is a reusable prompt preset you can @mention in any chat to instantly apply a specific style or behaviour.",
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

/* ─── Color map ──────────────────────────────────────────── */
const COLOR_MAP: Record<string, string> = {
  indigo: "text-indigo-400",
  violet: "text-violet-400",
  emerald: "text-emerald-400",
  pink: "text-pink-400",
  amber: "text-amber-400",
  blue: "text-blue-400",
  cyan: "text-cyan-400",
  rose: "text-rose-400",
  teal: "text-teal-400",
};

/* ─── Page ───────────────────────────────────────────────── */
export default function FeaturesPage() {
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
        <section className="relative px-6 pt-20 pb-28 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/8 rounded-full blur-[80px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[13px] font-medium text-white/50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Everything Wasp AI can do
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-5xl font-extrabold leading-[1.04] tracking-[-0.04em] mb-6"
            style={{ fontSize: "clamp(38px, 7vw, 96px)" }}
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
              Every feature.
            </span>
            <span
              style={{
                display: "block",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.18) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              One platform.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-xl text-[17px] text-white/40 leading-relaxed mb-10"
          >
            From 20+ AI models to automated workflows, image generation, code
            execution, and a full document suite — it&apos;s all here, in one
            place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-20"
          >
            <Link
              href="/sign-in"
              className="group inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 rounded-full font-bold text-[15px] hover:bg-white/90 transition-all"
            >
              Try Everything Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/subscription"
              className="inline-flex items-center gap-2 border border-white/10 text-white/60 hover:text-white hover:border-white/20 px-7 py-3.5 rounded-full font-medium text-[15px] transition-all"
            >
              View Pricing
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-px w-full max-w-3xl bg-white/5 rounded-2xl overflow-hidden border border-white/5"
          >
            {STATS.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center py-6 px-4 bg-[#0d0d0f] gap-1"
              >
                <span className="text-3xl md:text-4xl font-black text-white">
                  {stat.value}
                </span>
                <span className="text-[12px] text-white/35 font-medium uppercase tracking-widest">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FEATURE GROUPS
        ══════════════════════════════════════════════════════ */}
        {FEATURE_GROUPS.map((group, gi) => (
          <section
            key={group.id}
            id={group.id}
            className={`px-6 py-28 ${gi % 2 === 1 ? "bg-[#0a0a0c]" : ""}`}
          >
            <div className="max-w-6xl mx-auto">
              {/* Section header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-16"
              >
                <p
                  className={`text-xs font-black tracking-[0.25em] uppercase mb-3 ${COLOR_MAP[group.color]}`}
                >
                  {group.category}
                </p>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-2xl">
                    {group.headline}
                  </h2>
                  {group.id === "agents" && (
                    <Link
                      href="/ai-agents"
                      className="group inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors shrink-0"
                    >
                      Full Agent Guide{" "}
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  )}
                  {group.id === "workflows" && (
                    <Link
                      href="/workflows"
                      className="group inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors shrink-0"
                    >
                      Full Workflows Guide{" "}
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  )}
                </div>
                <p className="mt-4 text-[16px] text-white/40 max-w-2xl leading-relaxed">
                  {group.subhead}
                </p>
              </motion.div>

              {/* Feature cards grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {group.features.map((feat, fi) => (
                  <motion.div
                    key={fi}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: fi * 0.07 }}
                    className={`group p-6 rounded-2xl border ${group.border} bg-gradient-to-br ${group.gradient} hover:scale-[1.02] transition-transform duration-300`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl border ${group.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feat.icon className={`w-4.5 h-4.5 ${group.iconColor}`} />
                    </div>
                    <h3 className="text-[15px] font-bold text-white mb-1.5">
                      {feat.title}
                    </h3>
                    <p className="text-[13px] text-white/40 leading-relaxed">
                      {feat.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* ══════════════════════════════════════════════════════
            BONUS FEATURES STRIP
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 py-20 bg-[#0a0a0c] border-y border-white/5">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <p className="text-xs font-black tracking-[0.25em] uppercase text-white/30 mb-3">
                And even more
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">
                Plus these power features.
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {QUICK_FEATURES.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-white/6 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
                    <feat.icon className="w-4 h-4 text-white/50" />
                  </div>
                  <span className="text-[13px] font-medium text-white/60">
                    {feat.label}
                  </span>
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
            CTA BANNER
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 pb-32">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-16 text-center"
            >
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-8">
                  <Sparkles className="w-8 h-8 text-white/70" />
                </div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-5">
                  Experience every feature.
                  <br />
                  <span
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.25))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Start for free.
                  </span>
                </h2>
                <p className="text-white/40 text-lg mb-10 max-w-md mx-auto">
                  No credit card needed. Explore 20+ models, tools, and
                  automation — free forever on the base plan.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/sign-in"
                    className="group inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-[16px] hover:bg-white/90 transition-all"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/subscription"
                    className="inline-flex items-center gap-2 border border-white/15 text-white/60 hover:text-white hover:border-white/25 px-8 py-4 rounded-full font-medium text-[16px] transition-all"
                  >
                    Compare Plans
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
            <div className="flex flex-wrap items-center gap-6 justify-center">
              {[
                { label: "Agents", href: "/ai-agents" },
                { label: "Workflows", href: "/workflows" },
                { label: "Pricing", href: "/subscription" },
                { label: "About", href: "/about" },
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
