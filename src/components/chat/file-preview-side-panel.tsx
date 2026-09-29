"use client";

import React, { memo, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  FileCode2,
  FileSpreadsheet,
  Image as ImageIcon,
  FileIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Copy,
  Check,
  Music,
  Video,
  Box,
  FileType,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCopy } from "@/hooks/use-copy";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { Model3DViewer } from "./model-3d-viewer";

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

// ─── Type detection helpers ────────────────────────────────────────────────────

function detectType(file: FilePreviewSidePanelProps["file"]) {
  const name = file.name || "";
  const ext = name.includes(".")
    ? (name.split(".").pop()?.toLowerCase() ?? "")
    : "";
  const mime = file.mimeType ?? "";
  const dataUrl = file.dataUrl ?? "";

  const isPdf =
    mime === "application/pdf" ||
    ext === "pdf" ||
    dataUrl.startsWith("data:application/pdf");

  const isImage =
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif", "svg", "ico", "bmp", "avif"].includes(
      ext,
    ) ||
    dataUrl.startsWith("data:image/");

  const isSvg = ext === "svg" || mime === "image/svg+xml";

  const isVideo =
    mime.startsWith("video/") ||
    ["mp4", "webm", "ogg", "mov", "mkv", "avi", "m4v"].includes(ext);

  const isAudio =
    mime.startsWith("audio/") ||
    ["mp3", "wav", "ogg", "flac", "aac", "m4a", "opus", "weba"].includes(ext);

  const isCsv = ext === "csv" || mime === "text/csv";

  const isXlsx =
    ["xlsx", "xls"].includes(ext) ||
    mime.includes("spreadsheetml") ||
    mime.includes("ms-excel");

  const isDocx =
    ["docx", "doc"].includes(ext) ||
    mime.includes("wordprocessingml") ||
    mime.includes("msword");

  const isMarkdown = ext === "md" || ext === "mdx" || mime === "text/markdown";

  const isHtml = ext === "html" || ext === "htm" || mime === "text/html";

  const isMermaid = ext === "mmd" || ext === "mermaid";

  const is3D = ["glb", "gltf"].includes(ext);

  const isCode =
    [
      "json",
      "js",
      "mjs",
      "ts",
      "tsx",
      "jsx",
      "py",
      "css",
      "sh",
      "bash",
      "yaml",
      "yml",
      "toml",
      "rs",
      "go",
      "java",
      "kt",
      "cpp",
      "c",
      "h",
      "rb",
      "php",
      "sql",
      "txt",
      "log",
      "env",
      "ini",
      "cfg",
      "xml",
    ].includes(ext) ||
    mime.includes("json") ||
    mime.includes("text/");

  return {
    ext,
    mime,
    isPdf,
    isImage,
    isSvg,
    isVideo,
    isAudio,
    isCsv,
    isXlsx,
    isDocx,
    isMarkdown,
    isHtml,
    isMermaid,
    is3D,
    isCode,
  };
}

// ─── Format size ───────────────────────────────────────────────────────────────

function fmtSize(bytes?: number): string {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

// ─── Sub-renderers ─────────────────────────────────────────────────────────────

function HtmlPreview({
  content,
  blobUrl,
}: { content?: string; blobUrl?: string | null }) {
  const [key, setKey] = useState(0);
  if (blobUrl) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-b border-border/40 text-[11px] text-muted-foreground shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          Live HTML Preview
          <button
            type="button"
            onClick={() => setKey((k) => k + 1)}
            className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-border/40 hover:bg-muted transition-colors"
          >
            ↺ Reload
          </button>
        </div>
        <iframe
          key={key}
          src={blobUrl}
          title="HTML Preview"
          className="w-full flex-1 border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  }
  if (content) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-b border-border/40 text-[11px] text-muted-foreground shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          Live HTML Preview
          <button
            type="button"
            onClick={() => setKey((k) => k + 1)}
            className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-border/40 hover:bg-muted transition-colors"
          >
            ↺ Reload
          </button>
        </div>
        <iframe
          key={key}
          srcDoc={content}
          title="HTML Preview"
          className="w-full flex-1 border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  }
  return null;
}

function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="w-full h-full overflow-auto p-6">
      <article className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}

function VideoPreview({ src }: { src: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black/90 p-4">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={src}
        controls
        className="max-w-full max-h-full rounded-lg shadow-2xl"
        style={{ maxHeight: "calc(100% - 2rem)" }}
      />
    </div>
  );
}

function AudioPreview({ src, fileName }: { src: string; fileName: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8">
      <div className="size-24 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-xl ring-4 ring-primary/20">
        <Music className="size-10" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground truncate max-w-xs">
          {fileName}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Audio File</p>
      </div>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        src={src}
        controls
        className="w-full max-w-md rounded-xl"
        style={{ outline: "none" }}
      />
    </div>
  );
}

function ImagePreview({
  src,
  fileName,
  isSvg,
  svgContent,
}: {
  src: string;
  fileName: string;
  isSvg?: boolean;
  svgContent?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  return (
    <>
      {/* Zoom / rotate controls injected by parent — passed back via ref not needed; just render here */}
      <div className="w-full h-full overflow-auto flex items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] relative">
        {/* Inline controls for image */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-xl bg-background/80 backdrop-blur-sm border border-border/60 shadow">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.1, z - 0.25))}
            className="p-1 hover:text-foreground text-muted-foreground transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
            className="p-1 hover:text-foreground text-muted-foreground transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="size-3.5" />
          </button>
          <div className="w-px h-4 bg-border/60 mx-0.5" />
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1 hover:text-foreground text-muted-foreground transition-colors"
            title="Rotate"
          >
            <RotateCw className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setRotation(0);
            }}
            className="p-1 hover:text-foreground text-muted-foreground transition-colors text-[10px] font-medium"
            title="Reset"
          >
            1:1
          </button>
        </div>

        {isSvg && svgContent ? (
          /* eslint-disable-next-line react/no-danger */
          <div
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: "transform 0.15s ease-out",
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="max-w-full max-h-full"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={fileName}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: "transform 0.15s ease-out",
            }}
            className="max-w-full max-h-full object-contain rounded-lg shadow-xl border border-border/40"
          />
        )}
      </div>
    </>
  );
}

function CsvPreview({ content }: { content: string }) {
  const data = useMemo(() => {
    const lines = content.trim().split("\n");
    if (!lines.length) return null;
    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines
      .slice(1, 200)
      .map((line) =>
        line.split(",").map((c) => c.trim().replace(/^"|"$/g, "")),
      );
    return { headers, rows };
  }, [content]);

  if (!data) return null;
  return (
    <div className="w-full h-full overflow-auto p-4">
      <div className="text-xs text-muted-foreground mb-2 px-1">
        {data.rows.length} rows × {data.headers.length} columns
      </div>
      <div className="border border-border rounded-xl overflow-hidden shadow-xs bg-card">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted text-muted-foreground font-semibold border-b border-border sticky top-0">
            <tr>
              <th className="px-2 py-2 text-muted-foreground/50 text-right font-normal w-8">
                #
              </th>
              {data.headers.map((h, i) => (
                <th key={i} className="px-3 py-2.5 truncate max-w-[150px]">
                  {h || `Col ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {data.rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-muted/40 transition-colors">
                <td className="px-2 py-1.5 text-muted-foreground/40 text-right text-[10px] tabular-nums">
                  {ri + 1}
                </td>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-1.5 truncate max-w-[200px] text-foreground font-mono"
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
  );
}

function XlsxPreview({ dataUrl, url }: { dataUrl?: string; url?: string }) {
  const [sheets, setSheets] = useState<{ name: string; data: string[][] }[]>(
    [],
  );
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const source = dataUrl || url;
    if (!source) {
      setError("No source");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const XLSX = await import("xlsx");
        let arrayBuffer: ArrayBuffer;

        if (source.startsWith("data:")) {
          const base64 = source.split(",")[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++)
            bytes[i] = binary.charCodeAt(i);
          arrayBuffer = bytes.buffer;
        } else {
          const res = await fetch(source);
          arrayBuffer = await res.arrayBuffer();
        }

        const wb = XLSX.read(arrayBuffer, { type: "array" });
        const result = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const data = XLSX.utils.sheet_to_json<string[]>(ws, {
            header: 1,
            defval: "",
          });
          return { name, data: data as string[][] };
        });
        setSheets(result);
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Failed to parse spreadsheet",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [dataUrl, url]);

  if (loading) return <LoadingState label="Parsing spreadsheet…" />;
  if (error) return <ErrorState message={error} />;
  if (!sheets.length) return <ErrorState message="No sheets found" />;

  const sheet = sheets[activeSheet];
  const headers = sheet.data[0] ?? [];
  const rows = sheet.data.slice(1);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Sheet tabs */}
      {sheets.length > 1 && (
        <div className="flex gap-1 px-3 pt-2 pb-0 shrink-0 overflow-x-auto">
          {sheets.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveSheet(i)}
              className={cn(
                "px-3 py-1 text-xs rounded-t-lg border border-b-0 transition-colors shrink-0",
                i === activeSheet
                  ? "bg-card text-foreground font-semibold border-border/60"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-auto p-3">
        <div className="text-xs text-muted-foreground mb-2 px-1">
          {rows.length} rows × {headers.length} columns
        </div>
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted font-semibold border-b border-border sticky top-0">
              <tr>
                <th className="px-2 py-2 text-muted-foreground/40 text-right w-8">
                  #
                </th>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 truncate max-w-[150px] text-muted-foreground"
                  >
                    {h || String.fromCharCode(65 + i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-muted/30 transition-colors">
                  <td className="px-2 py-1.5 text-muted-foreground/40 text-right tabular-nums text-[10px]">
                    {ri + 1}
                  </td>
                  {headers.map((_, ci) => (
                    <td
                      key={ci}
                      className="px-3 py-1.5 truncate max-w-[200px] font-mono"
                    >
                      {row[ci] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DocxPreview({ dataUrl, url }: { dataUrl?: string; url?: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const source = dataUrl || url;
    if (!source) {
      setError("No source");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const mammoth = await import("mammoth");
        let arrayBuffer: ArrayBuffer;

        if (source.startsWith("data:")) {
          const base64 = source.split(",")[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++)
            bytes[i] = binary.charCodeAt(i);
          arrayBuffer = bytes.buffer;
        } else {
          const res = await fetch(source);
          arrayBuffer = await res.arrayBuffer();
        }

        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtml(result.value);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to parse document");
      } finally {
        setLoading(false);
      }
    })();
  }, [dataUrl, url]);

  if (loading) return <LoadingState label="Converting document…" />;
  if (error) return <ErrorState message={error} />;
  if (!html) return <ErrorState message="Empty document" />;

  return (
    <div className="w-full h-full overflow-auto p-6 bg-white dark:bg-zinc-950">
      {/* eslint-disable-next-line react/no-danger */}
      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function CodePreview({ content }: { content: string }) {
  const { copy, copied } = useCopy();
  const lineCount = content.split("\n").length;
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border/40 shrink-0">
        <span className="text-[11px] text-muted-foreground font-mono">
          {lineCount} lines
        </span>
        <button
          type="button"
          onClick={() => copy(content)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check className="size-3 text-emerald-500" />
          ) : (
            <Copy className="size-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 font-mono text-xs bg-[#0d0d0d]">
        <pre className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  );
}

function MermaidPreview({ content }: { content: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "dark" });
        const { svg: rendered } = await mermaid.render(
          "preview-diagram",
          content.trim(),
        );
        setSvg(rendered);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Mermaid render failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [content]);

  if (loading) return <LoadingState label="Rendering diagram…" />;
  if (error) return <ErrorState message={error} />;
  if (!svg) return null;

  return (
    <div className="w-full h-full overflow-auto flex items-center justify-center p-6">
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: svg }} className="max-w-full" />
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-destructive p-6 text-center">
      <FileIcon className="size-8 text-destructive/50" />
      <p className="text-sm font-medium">Preview failed</p>
      <p className="text-xs text-muted-foreground max-w-xs">{message}</p>
    </div>
  );
}

function FallbackState({
  onDownload,
  fileName,
}: { onDownload: () => void; fileName: string }) {
  return (
    <div className="p-8 text-center flex flex-col items-center gap-3 text-muted-foreground">
      <FileIcon className="size-12 stroke-[1.5] text-muted-foreground/50" />
      <p className="text-sm font-medium text-foreground">
        No preview available
      </p>
      <p className="text-xs max-w-xs">
        This file type can&apos;t be rendered in the browser. Download it to
        open with a compatible app.
      </p>
      <button
        type="button"
        onClick={onDownload}
        className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors"
      >
        <Download className="size-4" />
        Download {fileName}
      </button>
    </div>
  );
}

// ─── Main icon for header ──────────────────────────────────────────────────────

function FileTypeIcon({ types }: { types: ReturnType<typeof detectType> }) {
  if (types.isPdf) return <FileText className="size-4" />;
  if (types.isImage) return <ImageIcon className="size-4" />;
  if (types.isCsv || types.isXlsx)
    return <FileSpreadsheet className="size-4" />;
  if (types.isDocx) return <FileType className="size-4" />;
  if (types.isVideo) return <Video className="size-4" />;
  if (types.isAudio) return <Music className="size-4" />;
  if (types.is3D) return <Box className="size-4" />;
  if (types.isCode || types.isMarkdown || types.isHtml)
    return <FileCode2 className="size-4" />;
  return <FileIcon className="size-4" />;
}

// ─── Main component ────────────────────────────────────────────────────────────

export const FilePreviewSidePanel = memo(function FilePreviewSidePanel({
  file,
  onClose,
  className,
}: FilePreviewSidePanelProps) {
  const { copy, copied } = useCopy();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const fileName = file.name || "Preview";
  const types = detectType(file);
  const { ext } = types;

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Convert base64 dataUrl → blob URL for binary files
  useEffect(() => {
    if (file.url && !file.url.startsWith("data:")) {
      setBlobUrl(file.url);
      return;
    }

    const raw =
      file.dataUrl || (file.url?.startsWith("data:") ? file.url : null);
    if (!raw) return;

    try {
      const parts = raw.split(",");
      const header = parts[0];
      const base64Data = parts[1];
      if (!base64Data) {
        setBlobUrl(raw);
        return;
      }

      const mime =
        header.match(/:(.*?);/)?.[1] ||
        file.mimeType ||
        (types.isPdf ? "application/pdf" : "application/octet-stream");

      const binary = atob(base64Data);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
      const blob = new Blob([array], { type: mime });
      const objectUrl = URL.createObjectURL(blob);
      setBlobUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } catch {
      setBlobUrl(raw);
    }
  }, [file.dataUrl, file.url, file.mimeType, types.isPdf]);

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

  // Determine what to render
  const renderCanvas = () => {
    // PDF
    if (types.isPdf && blobUrl) {
      return (
        <iframe
          src={`${blobUrl}#toolbar=1&navpanes=0`}
          title={fileName}
          className="w-full h-full border-0 bg-white shadow-inner"
        />
      );
    }

    // HTML — live sandbox
    if (types.isHtml) {
      return <HtmlPreview content={file.content} blobUrl={blobUrl} />;
    }

    // Markdown
    if (types.isMarkdown && file.content) {
      return <MarkdownPreview content={file.content} />;
    }

    // Mermaid diagram
    if (types.isMermaid && file.content) {
      return <MermaidPreview content={file.content} />;
    }

    // Video
    if (types.isVideo && (blobUrl || file.url)) {
      return <VideoPreview src={(blobUrl || file.url)!} />;
    }

    // Audio
    if (types.isAudio && (blobUrl || file.url)) {
      return <AudioPreview src={(blobUrl || file.url)!} fileName={fileName} />;
    }

    // SVG — inline render
    if (types.isSvg) {
      const src = blobUrl || file.dataUrl || file.url;
      return (
        <ImagePreview
          src={src || ""}
          fileName={fileName}
          isSvg={!!file.content}
          svgContent={file.content}
        />
      );
    }

    // Image
    if (types.isImage && (blobUrl || file.dataUrl || file.url)) {
      const src = (blobUrl || file.dataUrl || file.url)!;
      return <ImagePreview src={src} fileName={fileName} />;
    }

    // CSV
    if (types.isCsv && file.content) {
      return <CsvPreview content={file.content} />;
    }

    // XLSX / XLS
    if (types.isXlsx) {
      return <XlsxPreview dataUrl={file.dataUrl} url={file.url} />;
    }

    // DOCX / DOC
    if (types.isDocx) {
      return <DocxPreview dataUrl={file.dataUrl} url={file.url} />;
    }

    // 3D GLB/GLTF
    if (types.is3D && (blobUrl || file.url)) {
      return <Model3DViewer src={(blobUrl || file.url)!} fileName={fileName} />;
    }

    // Code / text
    if (types.isCode && file.content) {
      return <CodePreview content={file.content} />;
    }

    // Raw text fallback
    if (file.content) {
      return <CodePreview content={file.content} />;
    }

    // No preview
    return <FallbackState onDownload={handleDownload} fileName={fileName} />;
  };

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
      {/* ── Top Header ── */}
      <div className="h-14 px-4 border-b border-border/60 bg-muted/30 flex items-center justify-between gap-3 shrink-0">
        {/* Left: file info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileTypeIcon types={types} />
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
              {fileName}
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground border border-border/40 shrink-0">
              {ext || (types.isPdf ? "PDF" : "FILE")}
            </span>
            {file.size && (
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                {fmtSize(file.size)}
              </span>
            )}
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1 shrink-0">
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
            title="Download"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
            title="Close (Esc)"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 w-full overflow-hidden relative">
        {renderCanvas()}
      </div>
    </motion.aside>
  );
});
