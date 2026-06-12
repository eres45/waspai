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
  ChevronDown,
  GitBranch,
  HardDriveUpload,
  Home,
  Info,
  Layers,
  Play,
  Settings2,
  Split,
  Terminal,
  FileText,
  RefreshCw,
  FlaskConical,
  CloudSun,
} from "lucide-react";

/* ─── Node type data (Unified, Clean Styling) ──────────────── */
const NODE_TYPES = [
  {
    key: "Input Node",
    icon: Home,
    description:
      "Define the entry point of your workflow, capturing custom parameters and user data passed from chat or system triggers.",
  },
  {
    key: "Output Node",
    icon: Play,
    description:
      "Collects and returns the final synthesized results. Every structured execution path successfully ends here.",
  },
  {
    key: "LLM Node",
    icon: Bot,
    description:
      "Route prompt states to any foundational AI model — GPT, Claude, Gemini, or Grok — and enforce structured schema returns.",
  },
  {
    key: "Tool Node",
    icon: Settings2,
    description:
      "Trigger native workspace tools in-flight, such as web searches, image generations, or sandbox code execution environments.",
  },
  {
    key: "Condition Node",
    icon: Split,
    description:
      "Branch execution paths with if/else evaluation steps, dynamically routing state depending on previous outputs.",
  },
  {
    key: "HTTP Node",
    icon: HardDriveUpload,
    description:
      "Call any external API endpoints or trigger outgoing webhooks using standard headers, parameters, and request payloads.",
  },
  {
    key: "Template Node",
    icon: FileText,
    description:
      "Compose dynamic text variables compiled from preceding nodes. Ideal for drafting context prompts or summaries.",
  },
  {
    key: "Code Node",
    icon: Terminal,
    description:
      "Write custom JavaScript or Python scripts to transform data arrays, filter parameters, or calculate states in sandbox.",
  },
  {
    key: "Note Node",
    icon: Info,
    description:
      "Attach documentation logs and commentary onto the canvas grid to explain complex integration nodes to teammates.",
  },
];

/* ─── Pre-built Blueprints ─────────────────────────────────── */
const EXAMPLES = [
  {
    icon: FlaskConical,
    title: "Autonomous Research Agent",
    description:
      "An automated sequence that searches the web for a topic, processes findings through an LLM synthesis step, and formats a markdown summary report.",
    tags: ["LLM", "Tool Node", "Output"],
  },
  {
    icon: CloudSun,
    title: "Dynamic Weather Integrator",
    description:
      "Fetch real-time weather stats via an HTTP endpoint, bind parameters to a template builder, and generate a natural language summary.",
    tags: ["HTTP Node", "Template", "Output"],
  },
  {
    icon: FileText,
    title: "Structured Data Summarizer",
    description:
      "Accept unstructured system logs, run a sandboxed Code node to clean and filter entries, then summarize findings using Claude.",
    tags: ["Input", "Code Node", "LLM"],
  },
  {
    icon: RefreshCw,
    title: "Contextual Auto-Responder",
    description:
      "Route incoming user inquiries through if/else logical conditions, apply custom instructions, and draft draft replies automatically.",
    tags: ["Condition", "LLM", "Output"],
  },
];

/* ─── Workflow Steps ───────────────────────────────────────── */
const STEPS = [
  {
    number: "01",
    icon: Layers,
    title: "Design visually",
    description:
      "Drag nodes onto an infinite blueprint grid. Each node represents a discrete, self-contained execution step.",
  },
  {
    number: "02",
    icon: GitBranch,
    title: "Connect the data flow",
    description:
      "Draw connection paths to define the sequence. Pass variables between output and input parameters seamlessly.",
  },
  {
    number: "03",
    icon: Play,
    title: "Deploy as a Skill",
    description:
      "Execute your workflow manually, trigger it via webhook, or link it directly as a tool for your AI agents to utilize.",
  },
];

/* ─── FAQ ──────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "What is an AI Workflow?",
    a: "An AI Workflow is a visual automation sequence created by linking discrete nodes on a canvas. Nodes execute tasks (e.g. calling an AI model, fetching HTTP responses, executing custom code) in order, routing data automatically.",
  },
  {
    q: "How does it differ from standard AI chat?",
    a: "Chat is conversational and one-off. Workflows are repeatable, structured, and programmatic. You define the sequence once and run it reliably with different variables, receiving predictable outputs each time.",
  },
  {
    q: "Do I need coding experience to build workflows?",
    a: "No. You can design, link, and deploy complex workflows visually. While you can write custom scripts in JavaScript or Python inside the Code Node, it is completely optional.",
  },
  {
    q: "Can I share my custom workflows?",
    a: "Yes. Workflows can be made public to share with the community, set to read-only so others can clone them, or kept private to your account.",
  },
  {
    q: "Which subscription tier supports workflows?",
    a: "Workflow creation and editor access require a Pro or Ultra subscription. Free tier accounts can execute workflows that have been shared with them.",
  },
];

/* ─── Modern Blueprint Canvas (Spline 3D Integration) ─────── */
function BlueprintCanvas() {
  return (
    <div className="relative w-full h-[320px] md:h-[450px] overflow-hidden rounded-2xl border border-white/5 bg-[#0d0d0f] shadow-2xl">
      <iframe
        src="https://my.spline.design/3ddiagram-QwZc5rZkQqOVNtikZLmNxwqc/"
        className="absolute w-[calc(100%+160px)] h-[calc(100%+60px)] -bottom-[30px] -right-[120px] pointer-events-auto select-none"
        style={{ border: "none" }}
      />
    </div>
  );
}

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

/* ─── Workflows Page Redesign ──────────────────────────────── */
export default function WorkflowsPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white selection:bg-purple-500/20 font-sans antialiased overflow-x-hidden">
      {/* Fixed Top Navbar */}
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
        <section className="relative px-6 pt-24 pb-32 flex flex-col items-center text-center overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600/[0.04] rounded-full blur-[100px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/15 bg-purple-500/5 px-4.5 py-1 text-[13px] font-medium text-purple-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
          >
            <Play className="w-3 h-3 fill-purple-400 text-purple-400" />
            Core Feature Guide
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-3xl font-extrabold leading-[1.08] tracking-[-0.03em] mb-6"
            style={{ fontSize: "clamp(38px, 6.5vw, 84px)" }}
          >
            <span className="block bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
              Automate Anything
            </span>
            <span className="block bg-gradient-to-b from-white/60 to-white/20 bg-clip-text text-transparent">
              With AI Workflows.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-lg text-[16px] text-neutral-400 font-light leading-relaxed mb-10"
          >
            Chain multiple AI model layers, external API calls, custom codes,
            and conditional branch logical operators inside a unified blueprint
            canvas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/sign-in"
              className="group inline-flex items-center gap-1.5 bg-white text-black px-6 py-3 rounded-lg font-semibold text-[14px] hover:bg-white/90 transition-all shadow-lg"
            >
              Start Building Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-1 border border-white/5 bg-[#161618] hover:bg-[#1c1c1f] hover:border-white/10 text-neutral-300 px-6 py-3 rounded-lg font-medium text-[14px] transition-all"
            >
              Learn More
            </a>
          </motion.div>

          {/* Blueprint Hero Graphic */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="w-full max-w-4xl px-4"
          >
            <BlueprintCanvas />
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════════════════ */}
        <section
          id="how-it-works"
          className="px-6 py-28 border-y border-white/5 bg-[#0d0d0f] relative"
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3 font-mono">
                Visual Architecture
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                Three steps to automation
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex flex-col gap-4 p-6.5 rounded-xl border border-white/5 bg-[#121214] hover:border-white/10 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-purple-300 shadow-sm">
                    <step.icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-neutral-500 tracking-wider">
                      PHASE {step.number}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed font-light">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            NODE TYPES SECTION
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
                Component Library
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent mb-4">
                Node Types
              </h2>
              <p className="text-neutral-400 text-sm md:text-base font-light max-w-md mx-auto">
                Combine standard logic layers and operational blocks to compile
                workflows configured for any logic.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {NODE_TYPES.map((node, i) => (
                <motion.div
                  key={node.key}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="group relative p-6 rounded-xl border border-white/5 bg-[#121214] hover:border-white/10 hover:bg-[#141417] transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4 text-neutral-400 group-hover:text-purple-300 group-hover:border-purple-500/20 transition-all duration-300">
                    <node.icon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">
                    {node.key}
                  </h3>
                  <p className="text-[13px] text-neutral-400 leading-relaxed font-light">
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
        <section className="px-6 py-28 border-t border-white/5 bg-[#121214]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3 font-mono">
                Blueprint Presets
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent mb-4">
                Start from a template
              </h2>
              <p className="text-neutral-400 text-sm md:text-base font-light max-w-md mx-auto">
                Clone pre-built pipeline configurations directly into your
                workspace.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              {EXAMPLES.map((ex, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="group relative p-6.5 rounded-xl border border-white/5 bg-[#0d0d0f] hover:border-white/10 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4 text-purple-300">
                    <ex.icon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">
                    {ex.title}
                  </h3>
                  <p className="text-[13px] text-neutral-400 leading-relaxed font-light mb-4">
                    {ex.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {ex.tags.map((tag, j) => (
                      <span
                        key={j}
                        className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-neutral-400"
                      >
                        {tag}
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
                Sign in to view templates library
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════════════════ */}
        <section className="px-6 py-28 border-t border-white/5 bg-[#121214]">
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
                Workflow FAQ
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
            CALL TO ACTION BANNER
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
                  Input
                </span>
              </div>

              <div className="absolute left-[28%] top-[18%] -translate-y-1/2 hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/5 bg-[#18181b]/60 backdrop-blur-sm opacity-25 select-none pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[9px] font-mono text-white/50 tracking-wider uppercase">
                  LLM
                </span>
              </div>

              <div className="absolute right-[22%] bottom-[20%] -translate-y-1/2 hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/5 bg-[#18181b]/60 backdrop-blur-sm opacity-25 select-none pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="text-[9px] font-mono text-white/50 tracking-wider uppercase">
                  Tool
                </span>
              </div>

              <div className="absolute right-[8%] top-[25%] -translate-y-1/2 hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/5 bg-[#18181b]/60 backdrop-blur-sm opacity-25 select-none pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="text-[9px] font-mono text-white/50 tracking-wider uppercase">
                  Output
                </span>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-14 h-14 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-center mb-6 text-purple-300 shadow-[0_0_20px_rgba(167,139,250,0.15)] group-hover:scale-105 group-hover:border-purple-500/40 transition-all duration-300">
                  <Play className="w-6 h-6 fill-purple-400/80 text-purple-400" />
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent mb-4">
                  Deploy custom pipelines.
                </h2>
                <p className="text-neutral-400 text-sm md:text-base font-light mb-8 max-w-sm">
                  Chain models, API execution layers, and codes on Wasp AI
                  today.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/sign-in"
                    className="group/btn inline-flex items-center gap-2 bg-white hover:bg-neutral-100 text-black px-6 py-3 rounded-xl font-bold text-xs shadow-lg shadow-white/5 hover:shadow-white/10 transition-all duration-200"
                  >
                    Start Designing
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
