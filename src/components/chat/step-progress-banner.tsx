"use client";

import { useMemo } from "react";
import { UIMessage } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProgressBannerProps {
  messages: UIMessage[];
  isLoading?: boolean;
  className?: string;
}

export function StepProgressBanner({
  messages,
  isLoading = false,
  className,
}: StepProgressBannerProps) {
  const stepInfo = useMemo(() => {
    // 1. Look for todo_write tool calls in recent assistant messages
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== "assistant" || !msg.parts) continue;

      for (const part of msg.parts as any[]) {
        const toolName = part.toolName || part.toolInvocation?.toolName;
        const input = part.input || part.args || part.toolInvocation?.args;

        if (toolName === "todo_write" && Array.isArray(input?.todos)) {
          const todos: Array<{ text: string; status: string }> = input.todos;
          const inProgressIdx = todos.findIndex(
            (t) => t.status === "in_progress",
          );

          if (inProgressIdx !== -1) {
            return {
              current: inProgressIdx + 1,
              total: todos.length,
              description: todos[inProgressIdx].text,
            };
          }
        }
      }
    }

    // 2. If actively loading, check latest executing tool or step
    if (isLoading && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant" && lastMsg.parts) {
        for (const part of lastMsg.parts as any[]) {
          const state = part.state;
          const isPending = !state || !state.startsWith("output");
          if (isPending) {
            const toolName = part.toolName || part.toolInvocation?.toolName;
            const input = part.input || part.args || part.toolInvocation?.args;

            if (toolName === "python-execution") {
              const codeLine = input?.code
                ? input.code.trim().split("\n")[0]
                : "";
              return {
                current: 1,
                total: 1,
                description: codeLine
                  ? `Running Python: ${codeLine}`
                  : "Executing Python script in sandbox...",
              };
            }
            if (toolName === "write_site_file") {
              const path = input?.path || "file";
              return {
                current: 1,
                total: 1,
                description: `Creating ${path} with code preview...`,
              };
            }
            if (toolName === "edit_site_file") {
              const path = input?.path || "file";
              return {
                current: 1,
                total: 1,
                description: `Editing ${path} in draft workspace...`,
              };
            }
            if (toolName === "image-search") {
              return {
                current: 1,
                total: 1,
                description: `Searching images for "${input?.query || "results"}"...`,
              };
            }
            if (toolName === "web-search" || toolName === "webSearch") {
              return {
                current: 1,
                total: 1,
                description: `Searching the web for "${input?.query || "results"}"...`,
              };
            }
            if (toolName) {
              return {
                current: 1,
                total: 1,
                description: `Executing ${toolName.replace(/[-_]/g, " ")}...`,
              };
            }
          }
        }
      }
    }

    return null;
  }, [messages, isLoading]);

  if (!stepInfo) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "w-full max-w-3xl mx-auto px-4 mb-2 select-none",
          className,
        )}
      >
        <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 dark:bg-teal-950/20 backdrop-blur-sm px-3.5 py-2.5 flex flex-col gap-1 shadow-xs">
          {/* Header Row: Step X/Y (left) and X/Y count (right) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
              {isLoading ? (
                <Loader2 className="size-3 animate-spin text-teal-500 shrink-0" />
              ) : (
                <Sparkles className="size-3 text-teal-500 shrink-0" />
              )}
              <span>
                Step {stepInfo.current}/{stepInfo.total}
              </span>
            </div>

            <span className="text-[11px] font-mono text-teal-600/80 dark:text-teal-400/80">
              {stepInfo.current}/{stepInfo.total}
            </span>
          </div>

          {/* Description Row */}
          <p className="text-xs text-foreground/90 font-normal leading-relaxed truncate">
            {stepInfo.description}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
