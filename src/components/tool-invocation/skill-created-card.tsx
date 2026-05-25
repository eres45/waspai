"use client";

import { useState, useEffect } from "react";
import { ToolUIPart } from "ai";
import {
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Tag,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "ui/button";

// Import modular agent visualizer components
import { AgentTaskCard } from "../agent/AgentTaskCard";
import { AgentTimeline } from "../agent/AgentTimeline";
import { AgentStep } from "../agent/AgentStep";
import { AgentLog } from "../agent/AgentLog";
import { AgentFilePreview } from "../agent/AgentFilePreview";

interface SkillCreatedCardProps {
  part: ToolUIPart;
}

interface WorkflowStep {
  title: string;
  status: "thinking" | "running" | "success" | "warning" | "failed" | "info";
  durationText?: string;
  command?: string;
  logOutput?: string;
  filePreview?: {
    fileName: string;
    filePath?: string;
    content: string;
  };
}

export function SkillCreatedCard({ part }: SkillCreatedCardProps) {
  const { state, output, input } = part as any;
  const [viewContent, setViewContent] = useState(false);

  const isLoading = !state?.startsWith("output");
  const isError = state === "output-error";

  const result = output as
    | {
        success: boolean;
        skillId?: string;
        name?: string;
        title?: string;
        message?: string;
        error?: string;
      }
    | undefined;

  // Soft failure: tool ran but returned { success: false }
  const isSoftError =
    !isLoading && !isError && result !== undefined && result.success === false;
  const isSuccess =
    !isLoading && !isError && !isSoftError && result?.success === true;

  const skillInput = input as {
    name?: string;
    title?: string;
    description?: string;
    content?: string;
    category?: string;
    tags?: string[];
    isPublic?: boolean;
  };

  // State to simulate sequential loading steps
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    // Reset progress when loading starts
    setSimulatedProgress(0);

    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Define steps with dynamic statuses based on state and simulated progress
  const steps: WorkflowStep[] = [
    {
      title: "Reading skill-creator documentation",
      status: !isLoading
        ? "success"
        : simulatedProgress > 0
          ? "success"
          : "running",
      durationText: !isLoading || simulatedProgress > 0 ? "0.4s" : undefined,
      command: "cat docs/SKILL_CREATION.md",
      logOutput:
        "Parsed documentation rules successfully.\nFound skill standard framework v1.2.\nIdentified active user workspace context.",
    },
    {
      title: `Creating folder structure for ${skillInput?.name || "skill"}`,
      status: !isLoading
        ? "success"
        : simulatedProgress > 1
          ? "success"
          : simulatedProgress === 1
            ? "running"
            : "info",
      durationText: !isLoading || simulatedProgress > 1 ? "0.3s" : undefined,
      command: `mkdir -p src/skills/${skillInput?.name || "custom-skill"}`,
      logOutput: `Created directories successfully:\n - src/skills/${skillInput?.name || "custom-skill"}/\n - src/skills/${skillInput?.name || "custom-skill"}/references/`,
    },
    {
      title: `Drafting and writing ${skillInput?.name ? `${skillInput.name}.md` : "SKILL.md"} template`,
      status: !isLoading
        ? "success"
        : simulatedProgress > 2
          ? "success"
          : simulatedProgress === 2
            ? "running"
            : "info",
      durationText: !isLoading || simulatedProgress > 2 ? "0.8s" : undefined,
      filePreview: skillInput?.content
        ? {
            fileName: skillInput.name ? `${skillInput.name}.md` : "SKILL.md",
            filePath: `src/skills/${skillInput.name || "custom"}/${skillInput.name || "custom"}.md`,
            content: skillInput.content,
          }
        : undefined,
    },
    {
      title: "Registering skill in Supabase database",
      status: !isLoading
        ? isSuccess
          ? "success"
          : "failed"
        : simulatedProgress > 3
          ? "success"
          : simulatedProgress === 3
            ? "running"
            : "info",
      durationText: !isLoading || simulatedProgress > 3 ? "0.5s" : undefined,
      command: "supabase db push --experimental",
      logOutput: !isLoading
        ? isSuccess
          ? `Inserted skill successfully:\n ID: ${result?.skillId || "generated-uuid"}\n Title: ${result?.title || skillInput?.title}\n Slug: ${result?.name || skillInput?.name}\n Category: ${skillInput?.category || "other"}`
          : `DB Error: ${result?.error || "Failed column constraint violation"}`
        : "Sending insert transaction to Supabase public schema...",
    },
    {
      title: "Installing skill to library active session",
      status: !isLoading
        ? isSuccess
          ? "success"
          : "info"
        : simulatedProgress === 4
          ? "running"
          : "info",
      durationText: !isLoading ? "0.2s" : undefined,
      logOutput:
        !isLoading && isSuccess
          ? "Success: Registered install entry in active user_skill table.\nSkill is immediately active in chat context."
          : "Checking install status...",
    },
  ];

  const handleViewInLibrary = () => {
    if (result?.skillId) {
      window.open(`/skills/${result.skillId}`, "_blank");
    }
  };

  const handleViewLibrary = () => {
    window.open("/skills?tab=mine", "_blank");
  };

  const categoryEmoji: Record<string, string> = {
    productivity: "⚡",
    coding: "💻",
    media: "🎨",
    writing: "✍️",
    research: "🔍",
    automation: "🤖",
    other: "✨",
  };

  const catEmoji = categoryEmoji[skillInput?.category || "other"] || "✨";

  // Map high-level status for AgentTaskCard
  const cardStatus = isLoading
    ? "running"
    : isError || isSoftError
      ? "failed"
      : "success";

  const cardTitle = isLoading
    ? `Creating "${skillInput?.title || "Skill"}"...`
    : isError || isSoftError
      ? "Skill Creation Failed"
      : `${catEmoji} Created ${result?.title || skillInput?.title || "Skill"}`;

  const cardSubtitle = isLoading
    ? "Generating skill instructions and registering..."
    : isError
      ? "An unexpected error occurred. Please try again."
      : isSoftError
        ? result?.error || "Failed to create skill. Slug might be taken."
        : skillInput?.description || "Skill saved to your library";

  const actionCount = steps.filter((s) => s.status === "success").length;
  const metadataText = isLoading
    ? `${simulatedProgress + 1}/5 tasks`
    : `${actionCount} steps completed`;

  const durationText = isLoading
    ? `${simulatedProgress}s`
    : isSuccess
      ? "2.2s"
      : "1.8s";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-xl my-2"
    >
      <AgentTaskCard
        title={cardTitle}
        subtitle={cardSubtitle}
        status={cardStatus}
        durationText={durationText}
        metadataText={metadataText}
        defaultExpanded={isLoading} // Auto-expand when loading to show cool steps
        autoCollapseOnSuccess={true} // Clean collapsing after 3 seconds
      >
        <div className="flex flex-col gap-4">
          {/* Active step progress indicator */}
          <AgentTimeline>
            {steps.map((step, index) => (
              <AgentStep
                key={index}
                title={step.title}
                status={step.status}
                durationText={step.durationText}
                defaultExpanded={step.status === "running"}
              >
                {step.command && (
                  <div className="mt-1.5 w-full">
                    <AgentLog command={step.command} output={step.logOutput} />
                  </div>
                )}
                {step.filePreview && (
                  <div className="mt-1.5 w-full">
                    <AgentFilePreview
                      fileName={step.filePreview.fileName}
                      filePath={step.filePreview.filePath}
                      content={step.filePreview.content}
                    />
                  </div>
                )}
              </AgentStep>
            ))}
          </AgentTimeline>

          {/* Success details & CTAs */}
          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-3 pt-3 border-t border-border/40 mt-1"
              >
                {/* Meta Attributes Row */}
                <div className="flex flex-wrap gap-2">
                  {skillInput?.category && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/30">
                      <span>Category:</span>
                      <span className="capitalize font-semibold text-foreground">
                        {skillInput.category}
                      </span>
                    </div>
                  )}
                  {result?.name && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/30 font-mono">
                      <span>/{result.name}</span>
                    </div>
                  )}
                  {skillInput?.isPublic !== undefined && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/30">
                      <span>{skillInput.isPublic ? "Public" : "Private"}</span>
                    </div>
                  )}
                </div>

                {/* Tags Section */}
                {skillInput?.tags && skillInput.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag className="size-3 text-muted-foreground shrink-0" />
                    {skillInput.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Full Instructions content preview */}
                {skillInput?.content && (
                  <div className="mt-1">
                    <button
                      onClick={() => setViewContent((v) => !v)}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors font-medium"
                    >
                      <BookOpen className="size-3" />
                      {viewContent ? "Hide" : "Preview"} raw prompt instructions
                    </button>
                    <AnimatePresence>
                      {viewContent && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <pre className="mt-2 p-3 rounded-lg bg-zinc-950/5 dark:bg-zinc-950/40 border border-border/40 text-[10px] text-muted-foreground overflow-x-auto max-h-40 whitespace-pre-wrap font-mono leading-relaxed select-text">
                            {skillInput.content}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* CTA Row */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleViewLibrary}
                    className="gap-1.5 h-7.5 text-xs rounded-lg"
                  >
                    <Sparkles className="size-3" />
                    View My Skills
                  </Button>
                  {result?.skillId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleViewInLibrary}
                      className="gap-1.5 h-7.5 text-xs rounded-lg"
                    >
                      <ExternalLink className="size-3" />
                      Open Skill
                    </Button>
                  )}
                  <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1 bg-emerald-500/5 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="size-3 shrink-0" />
                    Active in Chat
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AgentTaskCard>
    </motion.div>
  );
}
