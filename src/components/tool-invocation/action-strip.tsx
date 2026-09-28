"use client";

import { ReactNode, useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Layers,
  Eye,
  ChevronRight,
  ChevronDown,
  Loader2,
  FileCode2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type ActionStripVariant =
  | "created"
  | "multi-edited"
  | "edited"
  | "terminal"
  | "unzipped"
  | "listed"
  | "reads"
  | "read-memory"
  | "read"
  | "generic";

export interface ActionStripProps {
  variant?: ActionStripVariant;
  label?: string;
  detail?: string;
  addedLines?: number;
  deletedLines?: number;
  latency?: string | number;
  budget?: string;
  isExecuting?: boolean;
  isError?: boolean;
  children?: ReactNode;
  stepId?: string;
  className?: string;
  defaultExpanded?: boolean;
}

export function ActionStrip({
  variant = "generic",
  label,
  detail,
  addedLines,
  deletedLines,
  latency,
  budget = "budget 30s",
  isExecuting = false,
  isError = false,
  children,
  stepId,
  className,
  defaultExpanded = false,
}: ActionStripProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Compute label and icon configuration based on variant
  const config = useMemo(() => {
    switch (variant) {
      case "created":
        return {
          icon: <Plus className="size-3.5 stroke-[2.5] text-foreground" />,
          title: label || "Created",
          titleClass: "font-semibold text-foreground",
          badgeColor: "text-emerald-500 font-mono",
        };
      case "multi-edited":
        return {
          icon: <Pencil className="size-3.5 stroke-[2] text-rose-500" />,
          title: label || "Multi-edited",
          titleClass: "font-semibold text-rose-500",
          badgeColor: "text-rose-500 font-mono",
        };
      case "edited":
        return {
          icon: <Pencil className="size-3.5 stroke-[2] text-amber-500" />,
          title: label || "Edited",
          titleClass: "font-semibold text-foreground",
          badgeColor: "text-emerald-500 font-mono",
        };
      case "unzipped":
      case "terminal":
        return {
          icon: (
            <div className="flex items-center text-[11px] font-mono font-bold text-foreground tracking-tighter">
              &gt;_
            </div>
          ),
          title: label || (variant === "unzipped" ? "Unzipped" : "Terminal"),
          titleClass: "font-semibold text-foreground",
          badgeColor: "text-muted-foreground",
        };
      case "listed":
        return {
          icon: <Layers className="size-3.5 stroke-[2] text-foreground" />,
          title: label || "Listed files",
          titleClass: "font-semibold text-foreground",
          badgeColor: "text-muted-foreground",
        };
      case "reads":
        return {
          icon: <Layers className="size-3.5 stroke-[2] text-foreground" />,
          title: label || "3 reads",
          titleClass: "font-semibold text-foreground",
          badgeColor: "text-muted-foreground",
        };
      case "read-memory":
        return {
          icon: <Eye className="size-3.5 stroke-[2] text-foreground" />,
          title: label || "Read memory",
          titleClass: "font-semibold text-foreground",
          badgeColor: "text-muted-foreground",
        };
      case "read":
        return {
          icon: <Eye className="size-3.5 stroke-[2] text-foreground" />,
          title: label || "Read",
          titleClass: "font-semibold text-foreground",
          badgeColor: "text-muted-foreground",
        };
      case "generic":
      default:
        return {
          icon: (
            <FileCode2 className="size-3.5 stroke-[2] text-muted-foreground" />
          ),
          title: label || "Executed",
          titleClass: "font-medium text-foreground",
          badgeColor: "text-muted-foreground",
        };
    }
  }, [variant, label]);

  // Formatted latency string (e.g., 2ms, 26ms, 441ms)
  const formattedLatency = useMemo(() => {
    if (latency === undefined || latency === null) return null;
    if (typeof latency === "number") return `${latency}ms`;
    if (
      typeof latency === "string" &&
      !latency.endsWith("ms") &&
      !latency.endsWith("s")
    ) {
      return `${latency}ms`;
    }
    return latency;
  }, [latency]);

  return (
    <div
      data-tool-step="true"
      data-step-id={stepId}
      className={cn("w-full my-1.5 select-none transition-colors", className)}
    >
      <button
        type="button"
        onClick={() => {
          if (children) {
            setExpanded((v) => !v);
          }
        }}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 group",
          "hover:bg-muted/40 cursor-pointer",
          expanded && "bg-muted/30",
        )}
      >
        {/* Left Side: Icon + Action Title + Optional Detail */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="shrink-0 flex items-center justify-center size-4">
            {isExecuting ? (
              <Loader2 className="size-3.5 text-primary animate-spin" />
            ) : isError ? (
              <AlertCircle className="size-3.5 text-destructive shrink-0" />
            ) : (
              config.icon
            )}
          </span>

          <span
            className={cn("text-xs tracking-tight truncate", config.titleClass)}
          >
            {config.title}
          </span>

          {detail && (
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px] sm:max-w-[280px]">
              {detail}
            </span>
          )}

          {/* Line Diff Badges (+401 -1380) */}
          {addedLines !== undefined && addedLines > 0 && (
            <span className="text-[11px] font-mono font-medium text-emerald-500 shrink-0">
              +{addedLines}
            </span>
          )}
          {deletedLines !== undefined && deletedLines > 0 && (
            <span className="text-[11px] font-mono font-medium text-rose-500 shrink-0">
              -{deletedLines}
            </span>
          )}
        </div>

        {/* Right Side: Latency · Budget + Chevron */}
        <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground/75 text-[11px] font-mono">
          {formattedLatency && <span>{formattedLatency}</span>}

          {formattedLatency && budget && (
            <span className="text-muted-foreground/40">·</span>
          )}

          {budget && (
            <span className="text-muted-foreground/70 hidden xs:inline sm:inline">
              {budget}
            </span>
          )}

          <span className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors ml-0.5">
            {expanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </span>
        </div>
      </button>

      {/* Expandable Content Drawer */}
      <AnimatePresence>
        {expanded && children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden mt-1.5"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
