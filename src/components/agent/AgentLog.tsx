"use client";

import React from "react";
import { Terminal, Copy, Check } from "lucide-react";
import { useCopy } from "@/hooks/use-copy";
import { Button } from "ui/button";
import { cn } from "lib/utils";

interface AgentLogProps {
  command?: string;
  output?: string;
  className?: string;
}

export function AgentLog({ command, output, className }: AgentLogProps) {
  const { copied, copy } = useCopy();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copy(command || output || "");
  };

  return (
    <div
      className={cn(
        "w-full rounded-lg border bg-zinc-950 dark:bg-zinc-950/80 shadow-inner overflow-hidden text-xs font-mono select-text",
        className,
      )}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Terminal className="size-3 text-zinc-500" />
          <span className="text-[10px] tracking-wide text-zinc-400 font-medium">
            Terminal
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Action icon for copy */}
          {(command || output) && (
            <Button
              variant="ghost"
              size="icon"
              className="size-4 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="size-2.5 text-emerald-500" />
              ) : (
                <Copy className="size-2.5" />
              )}
            </Button>
          )}
          {/* Mac style control dots */}
          <div className="flex gap-1 shrink-0">
            <span className="size-1.5 rounded-full bg-zinc-800" />
            <span className="size-1.5 rounded-full bg-zinc-800" />
            <span className="size-1.5 rounded-full bg-zinc-800" />
          </div>
        </div>
      </div>

      {/* Terminal body */}
      <div className="p-3 overflow-x-auto max-h-48 whitespace-pre leading-relaxed text-zinc-300 select-text">
        {command && (
          <div className="flex gap-1.5 text-emerald-400">
            <span className="text-zinc-600 select-none">$</span>
            <span className="break-all">{command}</span>
          </div>
        )}
        {output && (
          <div className={command ? "mt-1.5 text-zinc-400" : "text-zinc-300"}>
            {output}
          </div>
        )}
      </div>
    </div>
  );
}
