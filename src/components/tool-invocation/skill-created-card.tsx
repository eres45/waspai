"use client";

import { useState } from "react";
import { ToolUIPart } from "ai";
import {
  CheckCircle2,
  Loader,
  Sparkles,
  ExternalLink,
  BookOpen,
  Tag,
  Zap,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { cn } from "lib/utils";

interface SkillCreatedCardProps {
  part: ToolUIPart;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-xl my-2"
    >
      <div
        className={cn(
          "rounded-2xl border overflow-hidden bg-gradient-to-br from-background via-background to-accent/10",
          isError || isSoftError
            ? "border-destructive/40"
            : isLoading
              ? "border-border/60"
              : "border-primary/30",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center gap-3 px-5 py-4 border-b",
            isLoading
              ? "border-border/40 bg-muted/30"
              : isError || isSoftError
                ? "border-destructive/20 bg-destructive/5"
                : "border-primary/20 bg-gradient-to-r from-primary/10 to-transparent",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center size-9 rounded-xl shrink-0",
              isLoading
                ? "bg-muted border border-border/50"
                : isError
                  ? "bg-destructive/10 border border-destructive/30"
                  : "bg-primary/15 border border-primary/30",
            )}
          >
            {isLoading ? (
              <Loader className="size-4 animate-spin text-muted-foreground" />
            ) : isError || isSoftError ? (
              <XCircle className="size-4 text-destructive" />
            ) : (
              <Sparkles className="size-4 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "font-semibold text-sm truncate",
                  isError || isSoftError
                    ? "text-destructive"
                    : "text-foreground",
                )}
              >
                {isLoading
                  ? "Creating Skill…"
                  : isError || isSoftError
                    ? "Skill Creation Failed"
                    : `${catEmoji} ${result?.title || skillInput?.title || "Skill Created"}`}
              </span>
              {!isLoading && !isError && !isSoftError && result?.success && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400 shrink-0"
                >
                  <CheckCircle2 className="size-3 mr-1" />
                  Installed
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {isLoading
                ? "Generating skill instructions and registering…"
                : isError
                  ? "An unexpected error occurred. Please try again."
                  : isSoftError
                    ? result?.error ||
                      "Failed to create skill. It may already exist or the input is invalid."
                    : skillInput?.description || "Skill saved to your library"}
            </p>
          </div>
        </div>

        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {/* Skill metadata */}
              <div className="px-5 py-4 flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {skillInput?.category && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/40">
                      <BookOpen className="size-3" />
                      <span className="capitalize">{skillInput.category}</span>
                    </div>
                  )}
                  {result?.name && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/40 font-mono">
                      <span>/{result.name}</span>
                    </div>
                  )}
                  {skillInput?.isPublic !== undefined && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/40">
                      <Zap className="size-3" />
                      <span>{skillInput.isPublic ? "Public" : "Private"}</span>
                    </div>
                  )}
                </div>

                {skillInput?.tags && skillInput.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag className="size-3 text-muted-foreground shrink-0" />
                    {skillInput.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Content preview toggle */}
                {skillInput?.content && (
                  <div>
                    <button
                      onClick={() => setViewContent((v) => !v)}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    >
                      <BookOpen className="size-3" />
                      {viewContent ? "Hide" : "Preview"} skill instructions
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
                          <pre className="mt-2 p-3 rounded-xl bg-muted/50 border border-border/40 text-xs text-muted-foreground overflow-x-auto max-h-52 whitespace-pre-wrap font-mono leading-relaxed">
                            {skillInput.content.slice(0, 800)}
                            {skillInput.content.length > 800 && "\n…"}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* CTA row */}
              <div className="flex items-center gap-2 px-5 pb-4">
                <Button
                  size="sm"
                  onClick={handleViewLibrary}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Sparkles className="size-3" />
                  View My Skills
                </Button>
                {result?.skillId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleViewInLibrary}
                    className="gap-1.5 h-8 text-xs"
                  >
                    <ExternalLink className="size-3" />
                    Open Skill
                  </Button>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  Active in your next chat ✓
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading shimmer bar */}
        {isLoading && (
          <div className="h-1 w-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary/60 rounded-full"
              animate={{ x: ["-100%", "200%"] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
