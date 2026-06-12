"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Split,
  Database,
  Shield,
  Cpu,
  PenTool,
  Share2,
  Zap,
} from "lucide-react";

/* ─── Feature categories (hero stat bar) ─────────────────── */
const STATS = [
  { value: "20+", label: "AI Models" },
  { value: "30+", label: "Built-in Tools" },
  { value: "9", label: "Workflow Nodes" },
  { value: "∞", label: "Possibilities" },
];

/* ─── All features grouped (Clean, Uniform Layout Data) ───── */
const FEATURE_GROUPS = [
  {
    id: "ai-models",
    category: "🤖 AI Models",
    headline: "Every top model. One interface.",
    subhead:
      "Stop switching between apps. Access GPT, Claude, Gemini, Grok, DeepSeek, Mistral, Llama and 20+ models from one unified chat experience.",
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
        icon: Split,
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
    headline: "The web at your AI's fingertips.",
    subhead:
      "Search the live web, scrape pages, fetch YouTube transcripts, and browse interactively with a cloud browser — all from chat.",
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

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white selection:bg-purple-500/20 overflow-x-hidden font-sans antialiased">
      {/* Top Fixed Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0f]/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/wasp-ai-logo.png"
              alt="Wasp AI Logo"
              width={32}
              height={32}
              className="rounded-md shadow-md group-hover:scale-105 transition-transform duration-300"
            />
            <span className="font-bold tracking-tight text-white group-hover:text-purple-400 transition-colors">
              Wasp AI
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
        <section className="relative px-6 pt-24 pb-28 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-purple-600/[0.03] rounded-full blur-[100px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4.5 py-1 text-[13px] font-medium text-neutral-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Product Capability Grid
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-4xl font-extrabold leading-[1.08] tracking-[-0.03em] mb-6"
            style={{ fontSize: "clamp(38px, 6.5vw, 84px)" }}
          >
            <span className="block bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
              Every feature.
            </span>
            <span className="block bg-gradient-to-b from-white/60 to-white/20 bg-clip-text text-transparent">
              One unified platform.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-lg text-[16px] text-neutral-400 font-light leading-relaxed mb-10"
          >
            Access foundational models, build custom workflows, design automated
            agents, and invoke communication blocks natively from chat.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-20"
          >
            <Link
              href="/sign-in"
              className="group inline-flex items-center gap-1.5 bg-white text-black px-6 py-3 rounded-lg font-semibold text-[14px] hover:bg-white/90 transition-all"
            >
              Try Everything Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/subscription"
              className="inline-flex items-center gap-1 border border-white/5 bg-[#161618] hover:bg-[#1c1c1f] hover:border-white/10 text-neutral-300 px-6 py-3 rounded-lg font-medium text-[14px] transition-all"
            >
              View Pricing
            </Link>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-px w-full max-w-3xl bg-white/5 rounded-xl overflow-hidden border border-white/5 shadow-2xl"
          >
            {STATS.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center py-6 px-4 bg-[#121214] gap-1"
              >
                <span className="text-2xl md:text-3xl font-extrabold text-white">
                  {stat.value}
                </span>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider font-mono">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FEATURE GROUPS LIST
        ══════════════════════════════════════════════════════ */}
        {FEATURE_GROUPS.map((group, gi) => (
          <section
            key={group.id}
            id={group.id}
            className={`px-6 py-28 border-t border-white/5 ${
              gi % 2 === 1 ? "bg-[#121214]" : "bg-[#0d0d0f]"
            }`}
          >
            <div className="max-w-6xl mx-auto">
              {/* Group Header */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-16"
              >
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-purple-400 mb-3 font-mono">
                  {group.category}
                </p>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <h2 className="text-2xl md:text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent max-w-2xl">
                    {group.headline}
                  </h2>
                  {group.id === "agents" && (
                    <Link
                      href="/ai-agents"
                      className="group inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors shrink-0"
                    >
                      Full Agent Guide
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  )}
                  {group.id === "workflows" && (
                    <Link
                      href="/workflows"
                      className="group inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors shrink-0"
                    >
                      Full Workflows Guide
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  )}
                </div>
                <p className="mt-4 text-sm md:text-base font-light text-neutral-400 max-w-2xl leading-relaxed">
                  {group.subhead}
                </p>
              </motion.div>

              {/* Cards Grid (Monochrome and Premium borders) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {group.features.map((feat, fi) => (
                  <motion.div
                    key={fi}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: fi * 0.05 }}
                    className="group p-6 rounded-xl border border-white/5 bg-[#121214] hover:border-white/10 hover:bg-[#141417] transition-all duration-200"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4 text-neutral-400 group-hover:text-purple-300 group-hover:border-purple-500/20 transition-all duration-300">
                      <feat.icon className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-[13px] text-neutral-400 leading-relaxed font-light">
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
        <section className="px-6 py-24 bg-[#121214] border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3 font-mono">
                Extensible Tools
              </p>
              <h2 className="text-3xl font-bold bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                Additional capabilities
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {QUICK_FEATURES.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group flex items-center gap-3.5 p-4 rounded-xl border border-white/5 bg-[#0d0d0f] hover:border-white/10 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-neutral-400 group-hover:text-purple-300 transition-colors">
                    <feat.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors">
                    {feat.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FAQ ACCORDIONS
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 py-28 bg-[#0d0d0f] border-t border-white/5">
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
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                Platform FAQ
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
              className="relative overflow-hidden rounded-2xl border border-white/5 hover:border-purple-500/20 bg-[#121214] p-12 md:p-16 text-center shadow-2xl transition-all duration-300 group"
            >
              {/* Grid backdrop */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:20px_20px]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.035)_0%,transparent_60%)]" />
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-transparent via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Faint connecting pipeline line */}
              <svg
                className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none hidden md:block"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M 8 65 Q 18 20 28 18 T 68 72 T 92 25"
                  fill="none"
                  stroke="rgb(167, 139, 250)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              </svg>

              {/* Mock Nodes floating in background */}
              <div className="absolute left-[8%] top-[65%] -translate-y-1/2 hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/5 bg-[#18181b]/60 backdrop-blur-sm opacity-25 select-none pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="text-[9px] font-mono text-white/50 tracking-wider uppercase">
                  Sandbox
                </span>
              </div>

              <div className="absolute left-[28%] top-[18%] -translate-y-1/2 hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/5 bg-[#18181b]/60 backdrop-blur-sm opacity-25 select-none pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[9px] font-mono text-white/50 tracking-wider uppercase">
                  Model API
                </span>
              </div>

              <div className="absolute right-[22%] bottom-[20%] -translate-y-1/2 hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/5 bg-[#18181b]/60 backdrop-blur-sm opacity-25 select-none pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="text-[9px] font-mono text-white/50 tracking-wider uppercase">
                  Database
                </span>
              </div>

              <div className="absolute right-[8%] top-[25%] -translate-y-1/2 hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/5 bg-[#18181b]/60 backdrop-blur-sm opacity-25 select-none pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="text-[9px] font-mono text-white/50 tracking-wider uppercase">
                  Analytics
                </span>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-14 h-14 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-center mb-6 text-purple-300 shadow-[0_0_20px_rgba(167,139,250,0.15)] group-hover:scale-105 group-hover:border-purple-500/40 transition-all duration-300">
                  <Sparkles className="w-6 h-6 fill-purple-400/80 text-purple-400" />
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent mb-4">
                  Experience every feature.
                </h2>
                <p className="text-neutral-400 text-sm md:text-base font-light mb-8 max-w-sm">
                  Access advanced workspace tooling, models, and custom
                  automations for free.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/sign-in"
                    className="group/btn inline-flex items-center gap-2 bg-white hover:bg-neutral-100 text-black px-6 py-3 rounded-xl font-bold text-xs shadow-lg shadow-white/5 hover:shadow-white/10 transition-all duration-200"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/subscription"
                    className="inline-flex items-center border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 text-neutral-200 px-6 py-3 rounded-xl font-bold text-xs transition-all duration-200"
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
