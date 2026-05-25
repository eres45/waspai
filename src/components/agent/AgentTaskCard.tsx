"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "lib/utils";

export interface AgentTaskCardProps {
  title: string;
  subtitle?: string;
  status: "thinking" | "running" | "success" | "warning" | "failed" | "info";
  durationText?: string;
  metadataText?: string;
  defaultExpanded?: boolean;
  autoCollapseOnSuccess?: boolean;
  children: React.ReactNode;
}

export function AgentTaskCard({
  title,
  subtitle,
  status,
  durationText,
  metadataText,
  defaultExpanded = false,
  autoCollapseOnSuccess = true,
  children,
}: AgentTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Sync expanded state if defaultExpanded changes
  useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded]);

  // Handle auto-collapse when state transitions to success
  useEffect(() => {
    if (status === "success" && autoCollapseOnSuccess) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, autoCollapseOnSuccess]);

  const getStatusConfig = () => {
    switch (status) {
      case "thinking":
        return {
          icon: <Loader2 className="size-4 animate-spin text-purple-500" />,
          containerBorder: "border-purple-500/20 bg-purple-500/[0.02]",
          glow: "shadow-[0_0_12px_rgba(168,85,247,0.05)]",
          headerBg: "bg-purple-500/[0.04]",
        };
      case "running":
        return {
          icon: <Loader2 className="size-4 animate-spin text-primary" />,
          containerBorder: "border-primary/20 bg-primary/[0.02]",
          glow: "shadow-[0_0_12px_rgba(var(--primary),0.05)]",
          headerBg: "bg-primary/[0.04]",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="size-4 text-emerald-500" />,
          containerBorder: "border-emerald-500/20 bg-emerald-500/[0.01]",
          glow: "shadow-[0_0_12px_rgba(16,185,129,0.05)]",
          headerBg: "bg-emerald-500/[0.03]",
        };
      case "failed":
        return {
          icon: <AlertCircle className="size-4 text-destructive" />,
          containerBorder: "border-destructive/20 bg-destructive/[0.01]",
          glow: "shadow-[0_0_12px_rgba(239,68,68,0.05)]",
          headerBg: "bg-destructive/[0.03]",
        };
      case "warning":
        return {
          icon: <AlertCircle className="size-4 text-amber-500" />,
          containerBorder: "border-amber-500/20 bg-amber-500/[0.01]",
          glow: "shadow-[0_0_12px_rgba(245,158,11,0.05)]",
          headerBg: "bg-amber-500/[0.03]",
        };
      case "info":
      default:
        return {
          icon: <Sparkles className="size-4 text-blue-500" />,
          containerBorder: "border-border/60 bg-muted/[0.01]",
          glow: "",
          headerBg: "bg-muted/[0.03]",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={cn(
        "w-full rounded-2xl border transition-all duration-300 backdrop-blur-md overflow-hidden",
        config.containerBorder,
        config.glow,
      )}
    >
      {/* Header (Accordion Trigger) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer select-none transition-colors duration-200 border-b",
          isExpanded ? "border-border/40" : "border-transparent",
          config.headerBg,
          "hover:bg-muted/10",
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Status Icon */}
          <div className="flex items-center justify-center size-7 rounded-lg bg-background border shadow-sm shrink-0">
            {config.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground tracking-tight truncate">
                {title}
              </span>
              {metadataText && (
                <span className="text-[10px] tracking-wide font-mono uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border/30">
                  {metadataText}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate leading-none">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Accordion Controls / Info */}
        <div className="flex items-center gap-2 shrink-0">
          {durationText && (
            <span className="text-[11px] font-mono text-muted-foreground/75 bg-muted/40 px-1.5 py-0.5 rounded">
              {durationText}
            </span>
          )}
          <div className="p-1 hover:bg-muted rounded-md transition-colors">
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-300 ease-out",
                isExpanded && "rotate-180",
              )}
            />
          </div>
        </div>
      </div>

      {/* Accordion Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="p-5 bg-background/30 text-sm">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
