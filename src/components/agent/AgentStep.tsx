"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Loader2,
  Play,
  AlertTriangle,
  X,
  Info,
  ChevronRight,
} from "lucide-react";
import { cn } from "lib/utils";

export interface AgentStepProps {
  title: string;
  status: "thinking" | "running" | "success" | "warning" | "failed" | "info";
  durationText?: string;
  defaultExpanded?: boolean;
  children?: React.ReactNode;
}

export function AgentStep({
  title,
  status,
  durationText,
  defaultExpanded = false,
  children,
}: AgentStepProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasContent = !!children;

  const getStepIcon = () => {
    switch (status) {
      case "thinking":
        return (
          <div className="z-10 flex items-center justify-center size-[22px] rounded-full border border-purple-500/30 bg-background shadow-[0_0_8px_rgba(168,85,247,0.15)] shrink-0">
            <Loader2 className="size-3 animate-spin text-purple-500" />
          </div>
        );
      case "running":
        return (
          <div className="z-10 flex items-center justify-center size-[22px] rounded-full border border-primary/30 bg-background shadow-[0_0_8px_rgba(var(--primary),0.15)] shrink-0">
            <Play className="size-2.5 text-primary fill-primary animate-pulse ml-0.5" />
          </div>
        );
      case "success":
        return (
          <div className="z-10 flex items-center justify-center size-[22px] rounded-full border border-emerald-500/40 bg-emerald-500/10 shrink-0">
            <Check className="size-3 text-emerald-600 stroke-[3px]" />
          </div>
        );
      case "failed":
        return (
          <div className="z-10 flex items-center justify-center size-[22px] rounded-full border border-destructive/40 bg-destructive/10 shrink-0">
            <X className="size-3 text-destructive stroke-[3px]" />
          </div>
        );
      case "warning":
        return (
          <div className="z-10 flex items-center justify-center size-[22px] rounded-full border border-amber-500/40 bg-amber-500/10 shrink-0">
            <AlertTriangle className="size-3 text-amber-600" />
          </div>
        );
      case "info":
      default:
        return (
          <div className="z-10 flex items-center justify-center size-[22px] rounded-full border border-border bg-background shrink-0">
            <Info className="size-3 text-muted-foreground" />
          </div>
        );
    }
  };

  const getTitleStyle = () => {
    switch (status) {
      case "thinking":
        return "text-purple-600 dark:text-purple-400 font-medium animate-pulse";
      case "running":
        return "text-foreground font-semibold";
      case "success":
        return "text-muted-foreground/90 font-medium";
      case "failed":
        return "text-destructive font-medium";
      case "warning":
        return "text-amber-600 dark:text-amber-400 font-medium";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Top row / Trigger */}
      <div
        role={hasContent ? "button" : undefined}
        tabIndex={hasContent ? 0 : undefined}
        onClick={hasContent ? () => setIsExpanded(!isExpanded) : undefined}
        className={cn(
          "flex items-center gap-3 w-full group/trigger",
          hasContent && "cursor-pointer select-none",
        )}
      >
        {/* Step Icon placed exactly over timeline line */}
        {getStepIcon()}

        {/* Step details */}
        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={cn(
                "text-xs leading-relaxed truncate",
                getTitleStyle(),
              )}
            >
              {title}
            </span>
            {hasContent && (
              <ChevronRight
                className={cn(
                  "size-3 text-muted-foreground/60 transition-transform duration-300",
                  isExpanded && "rotate-90",
                  "group-hover/trigger:text-muted-foreground",
                )}
              />
            )}
          </div>

          {durationText && (
            <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
              {durationText}
            </span>
          )}
        </div>
      </div>

      {/* Expandable step content (logs/previews) */}
      <AnimatePresence initial={false}>
        {hasContent && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* Shift content to the right of the left icon/line */}
            <div className="pl-[34px] pt-2 pb-1 pr-1 w-full">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
