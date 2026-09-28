"use client";

import { useState, useMemo, useEffect, Fragment } from "react";
import type { JSX } from "react";
import { ToolUIPart } from "ai";
import {
  Copy,
  Check,
  Download,
  Eye,
  RotateCw,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent } from "ui/dialog";
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

interface WriteSiteFileCardProps {
  part: ToolUIPart;
}

function getFileCategory(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  if (
    [
      "html",
      "htm",
      "js",
      "ts",
      "jsx",
      "tsx",
      "css",
      "py",
      "kt",
      "rs",
      "go",
      "json",
    ].includes(ext || "")
  ) {
    return "Code";
  }
  if (["md", "txt", "pdf", "doc", "docx"].includes(ext || "")) {
    return "Doc";
  }
  return "File";
}

function getLanguage(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "css") return "css";
  if (ext === "js" || ext === "mjs") return "javascript";
  if (ext === "ts") return "typescript";
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "json") return "json";
  if (ext === "py") return "python";
  if (ext === "kt") return "kotlin";
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

export function WriteSiteFileCard({ part }: WriteSiteFileCardProps) {
  const { state, output, input, toolName, toolCallId } = part as any;
  const [showFull, setShowFull] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const { copied, copy } = useCopy();

  const isLoading = !state?.startsWith("output");
  const isEditing = toolName === "edit_site_file";

  const siteInput = input as {
    path?: string;
    content?: string;
    targetContent?: string;
    replacementContent?: string;
    projectName?: string;
  };

  const result = output as
    | {
        success: boolean;
        path: string;
        size?: number;
        content: string;
        projectId?: string | null;
      }
    | undefined;

  const filePath = result?.path ?? siteInput?.path ?? "file";
  const fileContent =
    result?.content ??
    siteInput?.content ??
    siteInput?.replacementContent ??
    "";
  const fileSize =
    result?.size ??
    (fileContent ? new TextEncoder().encode(fileContent).byteLength : 0);

  const fileName = filePath.split("/").pop() ?? filePath;
  const ext = (fileName.split(".").pop() || "").toUpperCase();
  const category = getFileCategory(filePath);
  const lang = getLanguage(filePath);
  const isHtml = ext === "HTML" || ext === "HTM";

  // Calculate lines added and deleted
  const { addedLines, deletedLines } = useMemo(() => {
    if (isEditing) {
      const added = siteInput?.replacementContent
        ? siteInput.replacementContent.split("\n").length
        : 1;
      const deleted = siteInput?.targetContent
        ? siteInput.targetContent.split("\n").length
        : 0;
      return { addedLines: added, deletedLines: deleted };
    }
    const lines = fileContent ? fileContent.split("\n").length : 1;
    return { addedLines: lines, deletedLines: 0 };
  }, [isEditing, siteInput, fileContent]);

  // Realistic latency simulation matching Cursor/Devin agent screenshots (e.g. 2ms, 1ms, 26ms)
  const latencyStr = useMemo(() => {
    if (isEditing) return "1ms";
    if (fileSize > 20000) return "5ms";
    return "2ms";
  }, [isEditing, fileSize]);

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

  const openHtmlPreview = () => {
    if (!fileContent) return;
    const blob = new Blob([fileContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full my-2 flex flex-col gap-2"
      data-tool-step="true"
      data-step-id={toolCallId || filePath}
    >
      {/* 1. Compact Action Strip (matches + Created +401 2ms · budget 30s >) */}
      <ActionStrip
        variant={isEditing ? "multi-edited" : "created"}
        label={
          isEditing
            ? isLoading
              ? "Editing"
              : "Multi-edited"
            : isLoading
              ? "Creating"
              : "Created"
        }
        addedLines={addedLines}
        deletedLines={deletedLines > 0 ? deletedLines : undefined}
        latency={latencyStr}
        budget="budget 30s"
        isExecuting={isLoading}
        defaultExpanded={false}
      >
        {/* Expanded Drawer: Code Diff / Viewer */}
        <div className="rounded-xl border border-border/40 overflow-hidden bg-[#0d0d0d] my-1 shadow-sm">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#141414] border-b border-border/20">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground ml-1 truncate max-w-[200px]">
                {filePath}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {fileContent.split("\n").length > 60 && (
                <button
                  type="button"
                  onClick={() => setShowFull((v) => !v)}
                  className="text-[10px] font-medium text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border/20 hover:bg-muted/40 transition-colors"
                >
                  {showFull ? "Show less" : "Show full"}
                </button>
              )}

              <button
                type="button"
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

          <div className="max-h-[300px] overflow-y-auto">
            <CodeHighlighter code={previewLines} lang={lang} />
          </div>
        </div>
      </ActionStrip>

      {/* 2. File Output Card (matches index.html / Code · HTML · 10 KB with download tray) */}
      {!isLoading && (
        <div className="w-full rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm hover:bg-card/80 transition-all p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-foreground truncate font-mono">
              {fileName}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              {category} · {ext || "FILE"} · {formatBytes(fileSize)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Preview Button for HTML files */}
            {isHtml && fileContent && (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                title="Open live interactive preview"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <Eye className="size-4" />
              </button>
            )}

            {/* Download File Tray Button */}
            {fileContent && (
              <button
                type="button"
                onClick={() => downloadFile(fileName, fileContent)}
                title="Download file"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <Download className="size-4.5 stroke-[1.75]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Live Interactive Sandbox Preview Dialog */}
      {isHtml && fileContent && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden flex flex-col bg-background border-border/80">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-card/60">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-foreground">
                  {fileName}
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  · Live Interactive Preview
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewKey((k) => k + 1)}
                  title="Reload preview"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <RotateCw className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={openHtmlPreview}
                  title="Open in new window"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <ExternalLink className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile(fileName, fileContent)}
                  title="Download file"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <Download className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full h-full bg-white relative">
              <iframe
                key={previewKey}
                srcDoc={fileContent}
                sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
                className="w-full h-full border-0"
                title={fileName}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
