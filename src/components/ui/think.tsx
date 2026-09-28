"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useEffect, useState } from "react";
import { TextShimmer } from "./text-shimmer";

const CLAUDE_THINKING_WORDS = [
  "Pondering",
  "Thinking",
  "Working",
  "Reasoning",
  "Analyzing",
  "Synthesizing",
  "Formulating",
  "Considering",
];

export interface ThinkProps {
  className?: string;
  showLabel?: boolean;
  words?: string[];
  intervalMs?: number;
}

export const Think = memo(function Think({
  className,
  showLabel = true,
  words = CLAUDE_THINKING_WORDS,
  intervalMs = 2600,
}: ThinkProps) {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    if (!showLabel || words.length <= 1) return;

    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [showLabel, words, intervalMs]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 py-1 select-none",
        className,
      )}
    >
      <div className="relative flex items-center justify-center">
        <motion.div
          className="h-2 w-2 rounded-full bg-primary/80"
          animate={{
            scale: [1, 1.45, 1],
            opacity: [0.45, 1, 0.45],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute h-3 w-3 rounded-full bg-primary/20 -z-10"
          animate={{
            scale: [0.8, 1.8, 0.8],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {showLabel && (
        <div className="relative inline-flex items-center min-h-[1.25rem] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={wordIndex}
              initial={{ opacity: 0, y: 3, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -3, filter: "blur(2px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="inline-flex items-center"
            >
              <TextShimmer
                as="span"
                duration={2}
                spread={1.8}
                className="text-sm font-medium tracking-tight text-muted-foreground/80"
              >
                {words[wordIndex]}
              </TextShimmer>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});
