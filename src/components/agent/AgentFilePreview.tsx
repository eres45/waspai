"use client";

import React, { useState } from "react";
import { FileText, ChevronRight, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCopy } from "@/hooks/use-copy";
import { Button } from "ui/button";
import { cn } from "lib/utils";

interface AgentFilePreviewProps {
  fileName: string;
  filePath?: string;
  content: string;
  defaultExpanded?: boolean;
}

export function AgentFilePreview({
  fileName,
  filePath,
  content,
  defaultExpanded = false,
}: AgentFilePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { copied, copy } = useCopy();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copy(content);
  };

  const getExtension = () => {
    const parts = fileName.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
  };

  return (
    <div className="w-full rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors duration-200 overflow-hidden text-xs">
      {/* File Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none border-b border-border/30 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center justify-center size-6 rounded bg-background border border-border/40 shrink-0 text-muted-foreground/80">
            <FileText className="size-3.5 text-sky-500" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col leading-none">
            <span className="font-semibold text-foreground truncate">
              {fileName}
            </span>
            {filePath && (
              <span className="text-[10px] text-muted-foreground/75 truncate mt-0.5 font-mono">
                {filePath}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Badge */}
          <span className="text-[9px] font-mono tracking-wider font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded leading-none">
            {getExtension()}
          </span>

          {/* Copy Button */}
          <Button
            variant="ghost"
            size="icon"
            className="size-5 text-muted-foreground hover:text-foreground rounded"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3" />
            )}
          </Button>

          <ChevronRight
            className={cn(
              "size-3 text-muted-foreground/60 transition-transform duration-300",
              isExpanded && "rotate-90",
            )}
          />
        </div>
      </div>

      {/* Code panel */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden bg-background/50"
          >
            <div className="p-3 border-t border-border/10">
              <pre className="font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-all max-h-52 overflow-y-auto leading-relaxed select-text p-2.5 rounded-lg bg-zinc-950/5 dark:bg-zinc-950/40 border border-border/30">
                {content.slice(0, 1000)}
                {content.length > 1000 && "\n\n... (truncated for preview)"}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
