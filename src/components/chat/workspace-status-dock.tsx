"use client";

import { useMemo } from "react";
import { UIMessage } from "ai";
import { FileText, Zap, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface WorkspaceFileItem {
  id: string;
  path: string;
  name: string;
  addedLines: number;
  deletedLines: number;
  type: "file" | "screenshot";
  url?: string;
  stepId?: string;
}

interface WorkspaceStatusDockProps {
  messages: UIMessage[];
  className?: string;
}

export function WorkspaceStatusDock({
  messages,
  className,
}: WorkspaceStatusDockProps) {
  // Aggregate all files and screenshots from message history
  const { files, screenshots, totalAdded, totalDeleted } = useMemo(() => {
    const fileMap = new Map<string, WorkspaceFileItem>();
    const screenshotList: WorkspaceFileItem[] = [];

    for (const msg of messages) {
      if (!msg.parts) continue;

      for (const part of msg.parts as any[]) {
        // 1. Tool Invocations (write_site_file, edit_site_file, code outputs)
        const toolName = part.toolName || part.toolInvocation?.toolName;
        const input = part.input || part.args || part.toolInvocation?.args;
        const output =
          part.output || part.result || part.toolInvocation?.result;
        const toolCallId = part.toolCallId || part.toolInvocation?.toolCallId;

        if (toolName === "write_site_file") {
          const path = output?.path || input?.path || "index.html";
          const content = output?.content || input?.content || "";
          const added = content ? content.split("\n").length : 1;
          const name = path.split("/").pop() || path;

          fileMap.set(path, {
            id: toolCallId || path,
            path,
            name,
            addedLines: added,
            deletedLines: 0,
            type: "file",
            stepId: toolCallId,
          });
        } else if (toolName === "edit_site_file") {
          const path = output?.path || input?.path || "file";
          const added = input?.replacementContent
            ? input.replacementContent.split("\n").length
            : 1;
          const deleted = input?.targetContent
            ? input.targetContent.split("\n").length
            : 0;
          const name = path.split("/").pop() || path;

          const existing = fileMap.get(path);
          fileMap.set(path, {
            id: toolCallId || path,
            path,
            name,
            addedLines: (existing?.addedLines || 0) + added,
            deletedLines: (existing?.deletedLines || 0) + deleted,
            type: "file",
            stepId: toolCallId,
          });
        }

        // 2. Screenshots / Images (from image_search, steel browser, or file parts)
        if (
          toolName === "steel-browser" ||
          toolName === "screenshot" ||
          toolName === "image-search"
        ) {
          const screenshotUrl =
            output?.screenshot || output?.image || output?.url;
          if (screenshotUrl && typeof screenshotUrl === "string") {
            screenshotList.push({
              id: toolCallId || `${screenshotList.length}`,
              path: "screenshot",
              name: "Screenshot",
              addedLines: 0,
              deletedLines: 0,
              type: "screenshot",
              url: screenshotUrl,
              stepId: toolCallId,
            });
          }
        }

        // 3. File attachments
        if (part.type === "file" && part.mimeType?.startsWith("image/")) {
          screenshotList.push({
            id: part.id || `${screenshotList.length}`,
            path: part.name || "image",
            name: part.name || "Screenshot",
            addedLines: 0,
            deletedLines: 0,
            type: "screenshot",
            url: part.url || part.dataUrl,
          });
        }
      }
    }

    const filesArray = Array.from(fileMap.values());
    let addedSum = 0;
    let deletedSum = 0;
    for (const f of filesArray) {
      addedSum += f.addedLines;
      deletedSum += f.deletedLines;
    }

    return {
      files: filesArray,
      screenshots: screenshotList,
      totalAdded: addedSum,
      totalDeleted: deletedSum,
    };
  }, [messages]);

  const hasFiles = files.length > 0;
  const hasScreenshots = screenshots.length > 0;

  if (!hasFiles && !hasScreenshots) {
    return null;
  }

  const scrollToStep = (stepId?: string) => {
    if (stepId) {
      const el = document.querySelector(`[data-step-id="${stepId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    const anyStep = document.querySelector(`[data-tool-step="true"]`);
    if (anyStep) {
      anyStep.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "w-full max-w-3xl mx-auto px-4 pt-2.5 pb-2 text-xs select-none",
          className,
        )}
      >
        {/* Line 1: Summary Header (e.g. Edited 1 file +401 -0  ...  ⚡ Auto) */}
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <div className="flex items-center gap-1.5 font-medium">
            {hasFiles ? (
              <>
                <span>
                  Edited {files.length} {files.length === 1 ? "file" : "files"}
                </span>
                <span className="font-mono text-emerald-500 font-semibold">
                  +{totalAdded}
                </span>
                <span className="font-mono text-rose-500 font-semibold">
                  -{totalDeleted}
                </span>
              </>
            ) : (
              <span>Screenshots ({screenshots.length})</span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground/80">
            <Zap className="size-3.5 stroke-[2] text-amber-500/90" />
            <span>Auto</span>
          </div>
        </div>

        {/* Line 2: Horizontal Scrollable Carousel of Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {hasFiles &&
            files.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => scrollToStep(file.stepId)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm",
                  "hover:bg-muted/40 hover:border-border transition-all duration-150 cursor-pointer shrink-0 text-left",
                )}
              >
                <FileText className="size-3.5 stroke-[1.75] text-muted-foreground shrink-0" />
                <span className="font-mono text-xs text-foreground truncate max-w-[170px] sm:max-w-[240px]">
                  {file.name}
                </span>
                {file.addedLines > 0 && (
                  <span className="font-mono text-[11px] text-emerald-500 font-semibold shrink-0">
                    +{file.addedLines}
                  </span>
                )}
                {file.deletedLines > 0 && (
                  <span className="font-mono text-[11px] text-rose-500 font-semibold shrink-0">
                    -{file.deletedLines}
                  </span>
                )}
              </button>
            ))}

          {hasScreenshots &&
            screenshots.map((s, idx) => (
              <div
                key={s.id || idx}
                onClick={() => scrollToStep(s.stepId)}
                className="size-10 rounded-lg border border-border/60 overflow-hidden shrink-0 bg-muted/30 cursor-pointer hover:border-primary transition-all relative"
              >
                {s.url ? (
                  <img
                    src={s.url}
                    alt="screenshot"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="size-4" />
                  </div>
                )}
              </div>
            ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
