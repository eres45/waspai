"use client";

import { useState, useMemo, useEffect, Fragment } from "react";
import type { JSX } from "react";
import { ToolUIPart } from "ai";
import {
  Copy,
  Check,
  Download,
  FileCode,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  bundledLanguages,
  codeToHast,
  type BundledLanguage,
} from "shiki/bundle/web";
import { jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { useCopy } from "@/hooks/use-copy";
import { ActionStrip } from "./action-strip";
import { toast } from "sonner";

interface ReadFileCardProps {
  part: ToolUIPart;
}

function getLanguage(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "css") return "css";
  if (ext === "js" || ext === "mjs") return "javascript";
  if (ext === "ts") return "typescript";
  if (ext === "jsx") return "jsx";
  if (ext === "tsx") return "tsx";
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "json") return "json";
  if (ext === "py") return "python";
  if (ext === "kt" || ext === "kts") return "kotlin";
  if (ext === "rs") return "rust";
  if (ext === "go") return "go";
  if (ext === "java") return "java";
  if (ext === "md") return "markdown";
  if (ext === "sql") return "sql";
  if (ext === "sh" || ext === "bash") return "shellscript";
  if (ext === "yaml" || ext === "yml") return "yaml";
  return "text";
}

function formatBytes(bytes: number) {
  if (!bytes || isNaN(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function downloadFile(filename: string, content: string) {
  try {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  } catch (_e) {
    toast.error("Failed to download file");
  }
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

export function ReadFileCard({ part }: ReadFileCardProps) {
  const { state, output, input, toolCallId } = part as any;
  const [showFull, setShowFull] = useState(false);
  const { copied, copy } = useCopy();

  const isLoading = !state?.startsWith("output");

  const fileInput = input as {
    path?: string;
    spillPath?: string;
    filename?: string;
    file?: string;
  };

  const result = output as
    | {
        success?: boolean;
        path?: string;
        size?: number;
        content?: string;
        error?: string;
      }
    | undefined;

  const filePath =
    result?.path ||
    fileInput?.path ||
    fileInput?.spillPath ||
    fileInput?.filename ||
    fileInput?.file ||
    "file";

  const fileContent =
    result?.content ||
    (result as any)?.preview ||
    (typeof output === "string" ? output : "");
  const fileSize =
    result?.size ??
    (result as any)?.totalBytes ??
    (fileContent ? new TextEncoder().encode(fileContent).byteLength : 0);

  const fileName = filePath.split("/").pop() ?? filePath;
  const ext = (fileName.split(".").pop() || "").toUpperCase();
  const lang = getLanguage(filePath);
  const isError = result?.success === false || !!result?.error;

  const totalLines = useMemo(() => {
    if (!fileContent) return 0;
    return fileContent.split("\n").length;
  }, [fileContent]);

  // Truncate content for preview (first 70 lines max) unless showFull is true
  const previewLines = useMemo(() => {
    if (showFull || !fileContent) return fileContent;
    const lines = fileContent.split("\n");
    if (lines.length <= 70) return fileContent;
    const shown = lines.slice(0, 70);
    return (
      shown.join("\n") +
      `\n\n/* ... ${lines.length - 70} more lines (click 'Show full' to expand) ... */`
    );
  }, [fileContent, showFull]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="w-full my-1.5 flex flex-col gap-1.5"
      data-tool-step="true"
      data-step-id={toolCallId || filePath}
    >
      {/* 1. Action Strip Header matching 👁 Read  0ms · budget 30s > */}
      <ActionStrip
        variant="read"
        label="Read"
        detail={fileName}
        latency="0ms"
        budget="budget 30s"
        isExecuting={isLoading}
        isError={isError}
        stepId={toolCallId || filePath}
        defaultExpanded={false}
      >
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm overflow-hidden text-xs">
          {/* File Header Bar inside Drawer */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/30">
            <div className="flex items-center gap-2 min-w-0">
              <FileCode className="size-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono text-xs text-foreground truncate max-w-[220px] sm:max-w-[360px]">
                {filePath}
              </span>
              {ext && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                  {ext}
                </span>
              )}
              {totalLines > 0 && (
                <span className="text-[11px] text-muted-foreground/75 font-mono hidden xs:inline shrink-0">
                  · {totalLines} {totalLines === 1 ? "line" : "lines"} (
                  {formatBytes(fileSize)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {totalLines > 70 && (
                <button
                  type="button"
                  onClick={() => setShowFull((v) => !v)}
                  className="px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded transition-colors cursor-pointer"
                >
                  {showFull ? "Collapse" : "Show full"}
                </button>
              )}

              {fileContent && (
                <button
                  type="button"
                  onClick={() => copy(fileContent)}
                  title="Copy file contents"
                  className="flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}

              {fileContent && (
                <button
                  type="button"
                  onClick={() => downloadFile(fileName, fileContent)}
                  title="Download file"
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded transition-colors cursor-pointer"
                >
                  <Download className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Drawer Body: Syntax Highlighted File Content */}
          {isLoading ? (
            <div className="p-4 flex items-center gap-2 text-muted-foreground italic text-xs">
              <FileText className="size-4 animate-pulse" />
              <span>Reading file contents...</span>
            </div>
          ) : isError ? (
            <div className="p-3 text-destructive flex items-center gap-2 text-xs bg-destructive/5">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{result?.error || "Failed to read file"}</span>
            </div>
          ) : fileContent ? (
            <div className="max-h-[360px] overflow-y-auto bg-black/40">
              <CodeHighlighter code={previewLines} lang={lang} />
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground italic text-xs">
              File is empty (0 bytes)
            </div>
          )}
        </div>
      </ActionStrip>
    </motion.div>
  );
}
