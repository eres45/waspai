"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import type { ContextCompactionInfo } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ContextCompactionPillProps {
  compaction: ContextCompactionInfo;
  className?: string;
}

export const ContextCompactionPill = memo(function ContextCompactionPill({
  compaction,
  className,
}: ContextCompactionPillProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { originalTokens, compactedTokens, compactedMsgCount, digest } =
    compaction;

  return (
    <div
      className={cn(
        "w-full max-w-3xl mx-auto px-4 py-2 select-none",
        className,
      )}
    >
      <div className="flex flex-col items-center">
        {/* Main pill matching Claude's exact aesthetic */}
        <button
          type="button"
          onClick={() => digest && setIsExpanded(!isExpanded)}
          className={cn(
            "group inline-flex items-center gap-2 text-[12px] sm:text-[13px] leading-relaxed",
            "text-muted-foreground/80 hover:text-muted-foreground transition-colors",
            "px-2.5 py-1 rounded-md cursor-pointer text-left",
          )}
        >
          {/* Subtle bullet indicator */}
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0 group-hover:bg-primary/70 transition-colors" />

          <span>
            Context memory compacted:{" "}
            <span className="font-mono text-[11px] sm:text-[12px]">
              ~{originalTokens.toLocaleString()}
            </span>{" "}
            &rarr;{" "}
            <span className="font-mono text-[11px] sm:text-[12px]">
              ~{compactedTokens.toLocaleString()}
            </span>{" "}
            tokens ({compactedMsgCount} msgs). Older detail is in digests
            &mdash; re-read files as needed.
          </span>

          {digest && (
            <span className="text-muted-foreground/40 group-hover:text-muted-foreground/70 shrink-0 ml-0.5">
              {isExpanded ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </span>
          )}
        </button>

        {/* Expandable digest drawer/card */}
        <AnimatePresence>
          {isExpanded && digest && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="w-full mt-2 overflow-hidden"
            >
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3.5 text-xs text-muted-foreground space-y-2 font-sans">
                <div className="flex items-center gap-1.5 text-foreground/80 font-medium text-[11px] uppercase tracking-wider">
                  <Layers className="size-3 text-primary/70" />
                  Compacted Context Summary
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-[11px] font-mono bg-background/50 p-2.5 rounded border border-border/40 max-h-48 overflow-y-auto">
                  {digest}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
