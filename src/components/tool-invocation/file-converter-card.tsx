"use client";

import { ToolUIPart } from "ai";
import {
  FileIcon,
  ArrowRight,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "ui/button";
import { Badge } from "ui/badge";

interface FileConverterCardProps {
  part: ToolUIPart;
}

interface ConversionResult {
  success: boolean;
  sourceFilename?: string;
  sourceType?: string;
  targetFilename?: string;
  targetType?: string;
  downloadUrl?: string;
  size?: number;
  guide?: string;
  error?: string;
}

/**
 * Returns a fitting Lucide icon based on the file extension
 */
function getFileIcon(ext?: string) {
  if (!ext) return FileIcon;
  const lower = ext.toLowerCase();

  if (["jpg", "jpeg", "png", "webp", "gif", "avif", "tiff"].includes(lower)) {
    return ImageIcon;
  }
  if (["csv", "xlsx", "xls"].includes(lower)) {
    return FileSpreadsheet;
  }
  if (["txt", "md", "pdf", "docx", "doc"].includes(lower)) {
    return FileText;
  }
  return FileIcon;
}

/**
 * Helper to format file size in bytes into human-readable strings
 */
function formatSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return "";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function FileConverterCard({ part }: FileConverterCardProps) {
  const input = part.input as any;
  const { state } = part;

  const result = useMemo(() => {
    if (!state.startsWith("output")) return null;
    return part.output as ConversionResult;
  }, [state, part.output]);

  const sourceUrl = input?.fileUrl || "";
  const targetFormat = (input?.targetFormat || "").toUpperCase();

  // Extract source filename from the input URL
  const sourceFilename = useMemo(() => {
    try {
      const urlPath = new URL(
        sourceUrl.startsWith("http")
          ? sourceUrl
          : `http://localhost${sourceUrl}`,
      ).pathname;
      return decodeURIComponent(urlPath.split("/").pop() || "file");
    } catch {
      return "Source File";
    }
  }, [sourceUrl]);

  const sourceExt = sourceFilename.split(".").pop()?.toUpperCase() || "FILE";

  const SourceIcon = getFileIcon(sourceExt);
  const TargetIcon = getFileIcon(targetFormat);

  // --- Rendering State 1: In Progress / Loading ---
  if (!state.startsWith("output")) {
    return (
      <div className="my-4 w-full max-w-2xl rounded-2xl border border-border/60 p-5 bg-card/40 backdrop-blur-md shadow-sm animate-pulse">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <SourceIcon className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-foreground">
                {sourceFilename}
              </p>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                Source Format: {sourceExt}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-primary">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Converting...
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto sm:text-right sm:justify-end">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-muted-foreground italic">
                Converting to...
              </p>
              <p className="text-xs text-primary uppercase font-bold tracking-wider">
                {targetFormat}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted text-muted-foreground">
              <TargetIcon className="size-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Rendering State 2: Conversion Error ---
  if (result && !result.success) {
    return (
      <div className="my-4 w-full max-w-2xl rounded-2xl border border-destructive/20 p-4 bg-destructive/5 backdrop-blur-md shadow-sm">
        <div className="flex gap-3 items-start">
          <div className="p-2 rounded-lg bg-destructive/10 text-destructive mt-0.5">
            <AlertCircle className="size-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-destructive">
              Conversion Failed
            </h4>
            <p className="text-xs text-muted-foreground">
              {result.error ||
                "An unknown error occurred during the conversion process."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Rendering State 3: Conversion Success ---
  const downloadUrl = result?.downloadUrl || "";
  const finalFilename =
    result?.targetFilename || `converted-file.${targetFormat.toLowerCase()}`;
  const finalSize = result?.size ? formatSize(result.size) : "";

  return (
    <div className="group/conv my-4 w-full max-w-2xl rounded-2xl border border-border/80 p-5 bg-card/60 hover:bg-card hover:border-primary/20 backdrop-blur-md shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-4">
        {/* Connection flow diagram */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-border/40">
          {/* Source File Card */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-muted text-muted-foreground group-hover/conv:bg-muted/80 transition-colors">
              <SourceIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                Source
              </p>
              <p className="text-sm font-semibold truncate text-foreground/80 max-w-[200px]">
                {result?.sourceFilename || sourceFilename}
              </p>
            </div>
          </div>

          {/* Flow Indicator */}
          <div className="flex items-center gap-2">
            <div className="h-[1px] w-8 bg-border hidden sm:block" />
            <div className="p-1 rounded-full bg-primary/10 text-primary">
              <ArrowRight className="size-4 animate-in slide-in-from-left-1 duration-700" />
            </div>
            <div className="h-[1px] w-8 bg-border hidden sm:block" />
          </div>

          {/* Target File Card */}
          <div className="flex items-center gap-3 min-w-0 sm:text-right sm:flex-row-reverse">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover/conv:bg-primary/20 transition-colors">
              <TargetIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-primary uppercase font-bold tracking-wider">
                Converted
              </p>
              <p className="text-sm font-bold truncate text-primary max-w-[200px]">
                {finalFilename}
              </p>
            </div>
          </div>
        </div>

        {/* Info & Action bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground self-start sm:self-center">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Ready {finalSize ? `• ${finalSize}` : ""}</span>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/5 border-emerald-500/20 px-2 py-0.5"
            >
              Success
            </Badge>
          </div>

          <Button
            size="sm"
            className="w-full sm:w-auto h-9 gap-2 bg-primary hover:bg-primary/90 shadow-sm transition-colors text-xs font-semibold"
            asChild
          >
            <a href={downloadUrl} download={finalFilename}>
              <Download className="size-3.5" />
              Download {targetFormat}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
