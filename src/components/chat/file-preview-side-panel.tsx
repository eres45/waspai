"use client";

import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  FileIcon,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import React, { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export interface FilePreviewSidePanelProps {
  file: {
    name: string;
    dataUrl?: string;
    url?: string;
    mimeType?: string;
    size?: number;
    content?: string;
  };
  onClose: () => void;
  className?: string;
}

export const FilePreviewSidePanel = memo(function FilePreviewSidePanel({
  file,
  onClose,
  className,
}: FilePreviewSidePanelProps) {
  const { copy, copied } = useCopy();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const fileName = file.name || "Preview";
  const ext = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase() || ""
    : "";

  const isPdf =
    file.mimeType === "application/pdf" ||
    ext === "pdf" ||
    file.dataUrl?.startsWith("data:application/pdf");

  const isImage =
    file.mimeType?.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext) ||
    file.dataUrl?.startsWith("data:image/");

  const isCsv = ext === "csv" || file.mimeType === "text/csv";
  const isCode =
    [
      "json",
      "js",
      "ts",
      "py",
      "html",
      "css",
      "md",
      "txt",
      "sh",
      "yaml",
      "yml",
    ].includes(ext) ||
    file.mimeType?.includes("json") ||
    file.mimeType?.includes("text/");

  // Convert base64 dataUrl into a Blob URL for reliable native iframe rendering
  useEffect(() => {
    if (file.url) {
      setBlobUrl(file.url);
      return;
    }

    if (file.dataUrl) {
      try {
        const parts = file.dataUrl.split(",");
        const header = parts[0];
        const base64Data = parts[1];
        const mime =
          header.match(/:(.*?);/)?.[1] ||
          file.mimeType ||
          (isPdf ? "application/pdf" : "application/octet-stream");

        const binary = atob(base64Data);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([array], { type: mime });
        const objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);

        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      } catch (e) {
        console.warn(
          "Failed creating blob URL for preview, falling back to dataUrl:",
          e,
        );
        setBlobUrl(file.dataUrl);
      }
    }
  }, [file.dataUrl, file.url, file.mimeType, isPdf]);

  const handleDownload = () => {
    const target = blobUrl || file.dataUrl || file.url;
    if (target) {
      const link = document.createElement("a");
      link.href = target;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${fileName}`);
      return;
    }

    if (file.content) {
      const blob = new Blob([file.content], {
        type: file.mimeType || "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Downloading ${fileName}`);
    }
  };

  const handleOpenNewTab = () => {
    const target = blobUrl || file.dataUrl || file.url;
    if (target) {
      window.open(target, "_blank", "noopener,noreferrer");
    } else {
      toast.error("Source URL unavailable");
    }
  };

  // Simple CSV parser for quick preview
  const csvData = useMemo(() => {
    if (!isCsv || !file.content) return null;
    const lines = file.content.trim().split("\n");
    if (!lines.length) return null;
    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines
      .slice(1, 100)
      .map((line) =>
        line.split(",").map((c) => c.trim().replace(/^"|"$/g, "")),
      );
    return { headers, rows };
  }, [isCsv, file.content]);

  return (
    <motion.aside
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className={cn(
        "h-full w-full lg:w-[48%] xl:w-[50%] shrink-0 flex flex-col",
        "bg-background/95 backdrop-blur-2xl border-l border-border/80 shadow-2xl",
        "relative z-40 overflow-hidden",
        className,
      )}
    >
      {/* Top Header Bar */}
      <div className="h-14 px-4 border-b border-border/60 bg-muted/30 flex items-center justify-between gap-3 shrink-0">
        {/* Left: File Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {isPdf && <FileText className="size-4" />}
            {isImage && <ImageIcon className="size-4" />}
            {isCsv && <FileSpreadsheet className="size-4" />}
            {isCode && <FileCode2 className="size-4" />}
            {!isPdf && !isImage && !isCsv && !isCode && (
              <FileIcon className="size-4" />
            )}
          </div>

          <div className="min-w-0 flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate max-w-[220px] sm:max-w-xs">
              {fileName}
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground border border-border/40 shrink-0">
              {ext || (isPdf ? "PDF" : "FILE")}
            </span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isImage && (
            <div className="flex items-center gap-1 mr-2 px-1 py-0.5 rounded-lg bg-muted/60 border border-border/40">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <span className="text-[10px] font-mono text-muted-foreground w-9 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1 hover:text-foreground text-muted-foreground transition-colors ml-0.5"
                title="Rotate"
              >
                <RotateCw className="size-3.5" />
              </button>
            </div>
          )}

          {file.content && (
            <button
              type="button"
              onClick={() => copy(file.content!)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Copy Content"
            >
              {copied ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenNewTab}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Open in new window"
          >
            <ExternalLink className="size-4" />
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs transition-colors"
            title="Download file"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
            title="Close Preview (Esc)"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Preview Canvas */}
      <div className="flex-1 w-full h-[calc(100%-3.5rem)] overflow-auto bg-muted/10 relative flex items-center justify-center">
        {/* PDF Preview */}
        {isPdf && blobUrl && (
          <iframe
            src={`${blobUrl}#toolbar=1&navpanes=0`}
            title={fileName}
            className="w-full h-full border-0 bg-white shadow-inner"
          />
        )}

        {/* Image Preview */}
        {isImage && (blobUrl || file.dataUrl) && (
          <div className="w-full h-full overflow-auto flex items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blobUrl || file.dataUrl}
              alt={fileName}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: "transform 0.15s ease-out",
              }}
              className="max-w-full max-h-full object-contain rounded-lg shadow-xl border border-border/40"
            />
          </div>
        )}

        {/* CSV Table Preview */}
        {isCsv && csvData && (
          <div className="w-full h-full overflow-auto p-4">
            <div className="border border-border rounded-xl overflow-hidden shadow-xs bg-card">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    {csvData.headers.map((h, i) => (
                      <th
                        key={i}
                        className="px-3 py-2.5 truncate max-w-[150px]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {csvData.rows.map((row, ri) => (
                    <tr
                      key={ri}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-3 py-2 truncate max-w-[200px] text-foreground font-mono"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Code / Text Preview */}
        {!isPdf && !isImage && (!isCsv || !csvData) && file.content && (
          <div className="w-full h-full overflow-auto p-4 font-mono text-xs">
            <pre className="p-4 rounded-xl bg-card border border-border/80 text-foreground overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-xs">
              {file.content}
            </pre>
          </div>
        )}

        {/* Fallback if no direct viewer */}
        {!isPdf && !isImage && !file.content && !blobUrl && (
          <div className="p-8 text-center flex flex-col items-center gap-3 text-muted-foreground">
            <FileIcon className="size-12 stroke-[1.5] text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              Preview is ready for download
            </p>
            <p className="text-xs max-w-xs">
              This file format cannot be rendered directly inside the canvas.
              Click below to download or view externally.
            </p>
            <button
              type="button"
              onClick={handleDownload}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors"
            >
              <Download className="size-4" />
              <span>Download {fileName}</span>
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
});
