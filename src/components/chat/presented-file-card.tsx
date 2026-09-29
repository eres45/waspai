"use client";

import { appStore } from "@/app/store";
import { cn } from "@/lib/utils";
import {
  Download,
  Eye,
  FileCode2,
  FileIcon,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import React, { memo } from "react";
import { toast } from "sonner";

export interface PresentedFile {
  name: string;
  size?: number;
  mime_type?: string;
  dataUrl?: string;
  url?: string;
  content?: string;
  title?: string;
}

interface PresentedFileCardProps {
  file: PresentedFile;
  className?: string;
  showCategoryLabel?: boolean;
}

export const PresentedFileCard = memo(function PresentedFileCard({
  file,
  className,
  showCategoryLabel = true,
}: PresentedFileCardProps) {
  const appStoreMutate = appStore((state) => state.mutate);

  const fileName = file.name || file.title || "document";
  const ext = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase() || ""
    : "";

  const isPdf =
    file.mime_type === "application/pdf" ||
    ext === "pdf" ||
    file.dataUrl?.startsWith("data:application/pdf");

  const isImage =
    file.mime_type?.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext);

  const isSpreadsheet =
    file.mime_type?.includes("spreadsheet") ||
    file.mime_type?.includes("csv") ||
    ["xlsx", "xls", "csv"].includes(ext);

  const isCode =
    file.mime_type?.includes("json") ||
    file.mime_type?.includes("javascript") ||
    file.mime_type?.includes("python") ||
    ["py", "js", "ts", "tsx", "jsx", "html", "css", "json", "sh"].includes(ext);

  const formatSize = (bytes?: number) => {
    if (!bytes) return null;
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const idx = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(1))} ${sizes[idx]}`;
  };

  const formattedSize = formatSize(file.size);

  const getSubtitle = () => {
    if (isPdf)
      return formattedSize
        ? `Document · PDF · ${formattedSize}`
        : "Document · PDF";
    if (isImage)
      return formattedSize
        ? `Image · ${ext.toUpperCase() || "PNG"} · ${formattedSize}`
        : `Image · ${ext.toUpperCase() || "PNG"}`;
    if (isSpreadsheet)
      return formattedSize
        ? `Spreadsheet · ${ext.toUpperCase()} · ${formattedSize}`
        : `Spreadsheet · ${ext.toUpperCase()}`;
    if (isCode)
      return formattedSize
        ? `Code · ${ext.toUpperCase()} · ${formattedSize}`
        : `Code · ${ext.toUpperCase()}`;
    return formattedSize ? `File · ${formattedSize}` : "File";
  };

  const handleDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    const targetUrl = file.dataUrl || file.url;
    if (targetUrl) {
      const link = document.createElement("a");
      link.href = targetUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${fileName}`);
      return;
    }

    if (file.content) {
      const blob = new Blob([file.content], {
        type: file.mime_type || "text/plain;charset=utf-8",
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
      return;
    }

    toast.error("File download source unavailable");
  };

  const handleOpenPreview = () => {
    appStoreMutate({
      previewFile: {
        name: fileName,
        dataUrl: file.dataUrl,
        url: file.url,
        mimeType: file.mime_type || (isPdf ? "application/pdf" : undefined),
        size: file.size,
        content: file.content,
      },
    });
  };

  return (
    <div className={cn("w-full my-2.5", className)}>
      {showCategoryLabel && (
        <div className="text-[11px] font-medium text-muted-foreground/75 mb-1.5 px-0.5 tracking-tight">
          Presented file
        </div>
      )}

      <div
        onClick={handleOpenPreview}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpenPreview();
          }
        }}
        className={cn(
          "group relative w-full p-3 sm:p-3.5 rounded-2xl border border-border/70",
          "bg-card/50 hover:bg-card/85 hover:border-border/90 backdrop-blur-md",
          "transition-all duration-200 cursor-pointer shadow-xs",
          "flex items-center justify-between gap-3 text-left",
        )}
      >
        {/* Left: Icon & File Meta */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "size-10 sm:size-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105",
              isPdf && "bg-rose-500/10 text-rose-500 border-rose-500/20",
              isImage &&
                "bg-violet-500/10 text-violet-500 border-violet-500/20",
              isSpreadsheet &&
                "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
              isCode && "bg-amber-500/10 text-amber-500 border-amber-500/20",
              !isPdf &&
                !isImage &&
                !isSpreadsheet &&
                !isCode &&
                "bg-primary/10 text-primary border-primary/20",
            )}
          >
            {isPdf && <FileText className="size-5" />}
            {isImage && <ImageIcon className="size-5" />}
            {isSpreadsheet && <FileSpreadsheet className="size-5" />}
            {isCode && <FileCode2 className="size-5" />}
            {!isPdf && !isImage && !isSpreadsheet && !isCode && (
              <FileIcon className="size-5" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {fileName}
            </p>
            <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">
              {getSubtitle()}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPreview();
            }}
            className={cn(
              "hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl",
              "text-xs font-medium text-muted-foreground hover:text-foreground",
              "bg-muted/40 hover:bg-muted transition-colors",
            )}
            title="Preview in side panel"
          >
            <Eye className="size-3.5" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl",
              "bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold",
              "border border-border/60 shadow-xs transition-transform active:scale-95",
            )}
            title={`Download ${fileName}`}
          >
            <Download className="size-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
});
