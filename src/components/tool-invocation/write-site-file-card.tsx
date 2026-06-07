"use client";

import { useState, useMemo, useEffect, Fragment } from "react";
import type { JSX } from "react";
import { ToolUIPart, getToolName } from "ai";
import {
  FileCode2,
  FileText,
  Palette,
  Zap,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "lib/utils";
import {
  bundledLanguages,
  codeToHast,
  type BundledLanguage,
} from "shiki/bundle/web";
import { jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { useCopy } from "@/hooks/use-copy";

interface WriteSiteFileCardProps {
  part: ToolUIPart;
}

function getFileIcon(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "css") return Palette;
  if (ext === "js" || ext === "ts" || ext === "mjs") return Zap;
  if (ext === "html" || ext === "htm") return FileCode2;
  return FileText;
}

function getFileBadgeColor(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "css") return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (ext === "js" || ext === "ts")
    return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  if (ext === "html" || ext === "htm")
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  return "bg-muted/60 text-muted-foreground border-border/30";
}

function getLanguage(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "css") return "css";
  if (ext === "js" || ext === "mjs") return "javascript";
  if (ext === "ts") return "typescript";
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "json") return "json";
  return "text";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

interface CodeHighlighterProps {
  code: string;
  lang: string;
}

function CodeHighlighter({ code, lang }: CodeHighlighterProps) {
  const [highlighted, setHighlighted] = useState<JSX.Element | null>(null);

  useEffect(() => {
    let active = true;
    const parsedLang = (
      bundledLanguages[lang as BundledLanguage] ? lang : "txt"
    ) as BundledLanguage;

    codeToHast(code, {
      lang: parsedLang,
      theme: "dark-plus",
    })
      .then((hast) => {
        if (!active) return;
        const rendered = toJsxRuntime(hast, {
          Fragment,
          jsx,
          jsxs,
          components: {
            pre: (props) => (
              <pre
                className="p-3 text-[11px] leading-relaxed font-mono whitespace-pre overflow-x-auto !bg-transparent"
                style={props.style}
              >
                {props.children}
              </pre>
            ),
          },
        }) as JSX.Element;
        setHighlighted(rendered);
      })
      .catch((err) => {
        console.error("Shiki highlight error:", err);
      });

    return () => {
      active = false;
    };
  }, [code, lang]);

  if (!highlighted) {
    return (
      <pre className="p-3 text-[11px] leading-relaxed font-mono text-muted-foreground whitespace-pre overflow-x-auto bg-transparent">
        <code>{code}</code>
      </pre>
    );
  }

  return highlighted;
}

export function WriteSiteFileCard({ part }: WriteSiteFileCardProps) {
  const { state, output, input, toolName } = part as any;
  const [expanded, setExpanded] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const { copied, copy } = useCopy();

  const isLoading = !state?.startsWith("output");
  const isEditing = toolName === "edit_site_file";

  const siteInput = input as {
    path?: string;
    content?: string;
    projectName?: string;
  };

  const result = output as
    | {
        success: boolean;
        path: string;
        size: number;
        content: string;
        projectId?: string | null;
      }
    | undefined;

  const filePath = result?.path ?? siteInput?.path ?? "file";
  const fileContent = result?.content ?? siteInput?.content ?? "";
  const fileSize =
    result?.size ?? new TextEncoder().encode(fileContent ?? "").byteLength;

  const Icon = getFileIcon(filePath);
  const badgeColor = getFileBadgeColor(filePath);
  const lang = getLanguage(filePath);

  // Show only the filename (not full path) in the header
  const fileName = filePath.split("/").pop() ?? filePath;

  // Truncate content for preview (first 60 lines max) unless showFull is true
  const previewLines = useMemo(() => {
    if (showFull) return fileContent;
    const lines = fileContent.split("\n");
    if (lines.length <= 60) return fileContent;
    const shown = lines.slice(0, 60);
    return (
      shown.join("\n") +
      "\n\n/* ... more lines (click 'Show full' in header to expand) ... */"
    );
  }, [fileContent, showFull]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full my-1"
    >
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left",
          "hover:bg-muted/40 transition-colors duration-150 group",
          expanded && "bg-muted/30",
        )}
      >
        {/* Status indicator */}
        <span className="shrink-0">
          {isLoading ? (
            <Loader2 className="size-3.5 text-primary animate-spin" />
          ) : (
            <CheckCircle2 className="size-3.5 text-emerald-500" />
          )}
        </span>

        {/* File type icon */}
        <Icon className="size-3.5 text-muted-foreground shrink-0" />

        {/* Label */}
        <span className="text-xs text-foreground/80 font-medium truncate flex-1">
          {isEditing
            ? isLoading
              ? "Editing"
              : "Edited"
            : isLoading
              ? "Writing"
              : "Created"}{" "}
          <span className="font-mono text-foreground">{fileName}</span>
        </span>

        {/* Size badge */}
        {!isLoading && (
          <span
            className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0",
              badgeColor,
            )}
          >
            {filePath.split(".").pop()?.toUpperCase()}
          </span>
        )}

        {/* Size */}
        {!isLoading && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatBytes(fileSize)}
          </span>
        )}

        {/* Expand chevron */}
        <span className="shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
          {expanded ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
        </span>
      </button>

      {/* Expandable code preview */}
      <AnimatePresence>
        {expanded && fileContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mx-3 mb-2 rounded-lg border border-border/30 overflow-hidden bg-[#0d0d0d]">
              {/* Code header bar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#141414] border-b border-border/20">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground ml-1">
                    {filePath}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {fileContent.split("\n").length > 60 && (
                    <button
                      onClick={() => setShowFull((v) => !v)}
                      className="text-[10px] font-medium text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border/20 hover:bg-muted/40 transition-colors"
                    >
                      {showFull ? "Show less" : "Show full"}
                    </button>
                  )}

                  <button
                    onClick={() => copy(fileContent)}
                    className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border/20 hover:bg-muted/40 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="size-2.5 text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-2.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              {/* Code content */}
              <div className="max-h-[320px] overflow-y-auto">
                <CodeHighlighter code={previewLines} lang={lang} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export interface GroupedSiteFileToolInvocationProps {
  parts: ToolUIPart[];
}

export function GroupedSiteFileToolInvocation({
  parts,
}: GroupedSiteFileToolInvocationProps) {
  const [expanded, setExpanded] = useState(false);

  const isAnyLoading = useMemo(() => {
    return parts.some((part) => !part.state.startsWith("output"));
  }, [parts]);

  // Find the last/currently active file info
  const activeFileInfo = useMemo(() => {
    const lastPart = parts[parts.length - 1];
    const input = lastPart.input as any;
    const output = lastPart.output as any;
    const toolName = getToolName(lastPart);
    const isEditing = toolName === "edit_site_file";
    const filePath = output?.path ?? input?.path ?? "file";
    const fileName = filePath.split("/").pop() ?? filePath;
    const isLoading = !lastPart.state.startsWith("output");

    return {
      fileName,
      isLoading,
      isEditing,
    };
  }, [parts]);

  // List of unique filenames created/modified in this group
  const fileNamesList = useMemo(() => {
    const names = new Set<string>();
    for (const part of parts) {
      const input = part.input as any;
      const output = part.output as any;
      const filePath = output?.path ?? input?.path ?? "";
      if (filePath) {
        names.add(filePath.split("/").pop() ?? filePath);
      }
    }
    return Array.from(names);
  }, [parts]);

  const totalSize = useMemo(() => {
    let size = 0;
    for (const part of parts) {
      const output = part.output as any;
      const input = part.input as any;
      if (output?.size) {
        size += output.size;
      } else if (input?.content) {
        size += new TextEncoder().encode(input.content).byteLength;
      }
    }
    return size;
  }, [parts]);

  return (
    <div
      className={cn(
        "w-full rounded-xl border bg-card/60 transition-all duration-200 overflow-hidden my-1",
        expanded ? "p-3 bg-muted/10" : "p-3 hover:bg-muted/30 cursor-pointer",
      )}
      onClick={() => {
        if (!expanded) setExpanded(true);
      }}
    >
      <div
        className="flex items-center justify-between gap-3 select-none"
        onClick={(e) => {
          if (expanded) {
            e.stopPropagation();
            setExpanded(false);
          }
        }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Status Indicator Icon */}
          <div className="shrink-0">
            {isAnyLoading ? (
              <Loader2 className="size-4 text-primary animate-spin" />
            ) : (
              <CheckCircle2 className="size-4 text-emerald-500" />
            )}
          </div>

          {/* Label / Status Text */}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5 flex-wrap">
              {isAnyLoading ? (
                <>
                  <span>
                    {activeFileInfo.isEditing ? "Modifying" : "Writing"}{" "}
                    <span className="font-mono">{activeFileInfo.fileName}</span>
                    ...
                  </span>
                  <span className="text-[10px] text-muted-foreground animate-pulse">
                    ({parts.length} files total)
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Created & configured{" "}
                    <span className="font-mono">
                      {fileNamesList.join(", ")}
                    </span>
                  </span>
                </>
              )}
            </span>
            {!expanded && !isAnyLoading && (
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Total size: {formatBytes(totalSize)}
              </span>
            )}
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 shrink-0">
          {!expanded && !isAnyLoading && (
            <span className="text-[10px] bg-secondary/80 text-muted-foreground font-medium px-2 py-0.5 rounded-md">
              {parts.length} {parts.length === 1 ? "file" : "files"}
            </span>
          )}
          <div className="hover:bg-secondary p-1 rounded-lg transition-colors">
            <ChevronDown
              className={cn(
                "size-3.5 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </div>
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border/10 pt-3 animate-in fade-in slide-in-from-top-1 duration-150">
          {parts.map((part) => (
            <WriteSiteFileCard key={part.toolCallId} part={part} />
          ))}
        </div>
      )}
    </div>
  );
}
