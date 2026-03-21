"use client";

import { ToolUIPart } from "ai";
import { FileIcon, Download, Loader2, Eye, EyeOff, Layout } from "lucide-react";
import { useMemo, useState, useRef } from "react";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { cn } from "lib/utils";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "ui/dialog";

interface DocumentGeneratorProps {
  part: ToolUIPart;
}

interface DocumentData {
  success: boolean;
  title: string;
  description?: string;
  summary?: string;
  theme?: "executive" | "modern" | "minimal" | "midnight" | "professional";
  primaryColor?: string;
  secondaryColor?: string;
  layout?: "standard" | "compact" | "spaced";
  sections: Array<{
    heading: string;
    content: string;
    subsections?: Array<{
      title?: string;
      text: string;
    }>;
  }>;
  filename: string;
  guide: string;
}

const THEME_CONFIGS = {
  executive: {
    primary: "#f97316", // Orange
    secondary: "#0f172a", // Dark Blue
    font: "font-serif",
    borderWidth: "border-t-[12px]",
  },
  modern: {
    primary: "#06b6d4", // Cyan
    secondary: "#000000",
    font: "font-sans",
    borderWidth: "border-t-[8px]",
  },
  minimal: {
    primary: "#64748b", // Slate
    secondary: "#f8fafc", // Very Light Gray
    font: "font-sans",
    borderWidth: "border-t-2",
  },
  midnight: {
    primary: "#3b82f6", // Blue
    secondary: "#020617", // Midnight
    font: "font-sans",
    borderWidth: "border-t-[16px]",
  },
  professional: {
    primary: "#eab308", // Gold
    secondary: "#1e3a8a", // Navy
    font: "font-serif",
    borderWidth: "border-t-[10px]",
  },
};

export function DocumentGeneratorToolInvocation({
  part,
}: DocumentGeneratorProps) {
  const t = useTranslations();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as DocumentData;
  }, [part.state, part.output]);

  const theme = THEME_CONFIGS[result?.theme || "executive"];
  const primaryColor = result?.primaryColor || theme.primary;
  const secondaryColor = result?.secondaryColor || theme.secondary;

  const handleExport = async () => {
    if (!result) return;

    setIsExporting(true);
    try {
      // Dynamic import with more robust error handling
      let html2pdfModule;
      try {
        html2pdfModule = await import("html2pdf.js" as any);
      } catch (_e) {
        console.warn("Standard import failed, trying global approach...");
        // Fallback for some bundling environments
        if (typeof window !== "undefined") {
          html2pdfModule = { default: (window as any).html2pdf };
        }
      }

      const html2pdf = html2pdfModule?.default || html2pdfModule;
      if (!html2pdf) throw new Error("html2pdf library not found");

      // We need to ensure the element is in the DOM and visible for html2canvas
      // If it's closed, we momentarily show it in a portal or off-screen
      const element = reportRef.current;
      if (!element) throw new Error("Report element not found");

      const opt = {
        margin: [15, 15],
        filename: result.filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: true,
          onclone: (clonedDoc: Document) => {
            // Replace oklch with safe rgb/hex in the cloned document
            const elements = clonedDoc.querySelectorAll("*");
            elements.forEach((el) => {
              if (el instanceof HTMLElement) {
                const style = window.getComputedStyle(el);
                // html2canvas struggles with complex oklch, fallback to computed RGB
                if (
                  style.backgroundColor.includes("oklch") ||
                  style.backgroundColor.startsWith("rgb")
                ) {
                  el.style.backgroundColor = style.backgroundColor;
                }
                if (
                  style.color.includes("oklch") ||
                  style.color.startsWith("rgb")
                ) {
                  el.style.color = style.color;
                }
                if (
                  style.borderColor.includes("oklch") ||
                  style.borderColor.startsWith("rgb")
                ) {
                  el.style.borderColor = style.borderColor;
                }
              }
            });
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF generated successfully!");
    } catch (error: any) {
      console.error("PDF Export Details:", error);
      toast.error(`Export failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!part.state.startsWith("output")) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
        <FileIcon className="size-4 animate-pulse" />
        <span>{t("Chat.Tool.generatingDocument")}...</span>
      </div>
    );
  }

  if (!result || !result.success) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive font-medium">
        <FileIcon className="size-4" />
        <span>
          {t("Common.error")}: {t("Chat.Tool.failedToGenerateDocument")}
        </span>
      </div>
    );
  }

  return (
    <div className="group/file my-4 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Download Card */}
      <div className="rounded-2xl border border-border/80 p-4 shadow-sm backdrop-blur-sm bg-card/60 hover:bg-card hover:border-primary/20 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 rounded-xl p-3 bg-primary/10 group-hover/file:bg-primary/20 transition-colors duration-300">
            <Layout className="size-6 text-primary" />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-semibold truncate text-foreground group-hover/file:text-primary transition-colors duration-300">
              {result.title}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
              {result.theme || "executive"} • {result.sections.length} Sections
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-2 border-primary/20 hover:bg-primary/5"
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            >
              {isPreviewOpen ? (
                <>
                  <EyeOff className="size-3.5" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="size-3.5" />
                  Preview
                </>
              )}
            </Button>

            <Button
              size="sm"
              className="h-8 gap-2 bg-primary hover:bg-primary/90"
              disabled={isExporting}
              onClick={handleExport}
            >
              {isExporting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Professional Document Preview Container */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50 border-border/50 shadow-2xl h-[90vh] flex flex-col">
          <DialogHeader className="px-4 py-3 border-b border-border/50 flex flex-row items-center justify-between sticky top-0 bg-slate-50 z-10">
            <DialogTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 m-0">
              Document Preview ({result.theme})
            </DialogTitle>
            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className="text-[10px] bg-primary/5 text-primary border-primary/20"
              >
                A4 Format
              </Badge>
              <Button
                size="sm"
                className="h-8 gap-2 bg-primary hover:bg-primary/90"
                disabled={isExporting}
                onClick={handleExport}
              >
                {isExporting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                Export PDF
              </Button>
            </div>
          </DialogHeader>

          {/* Scrollable Container for the Document */}
          <div className="flex-1 overflow-y-auto w-full flex justify-center bg-slate-100 p-4 sm:p-8">
            {/* The Actual A4 Document */}
            <div
              ref={reportRef}
              className={cn(
                "p-12 text-slate-900 bg-white shadow-sm ring-1 ring-slate-200/50 w-full max-w-[210mm] relative",
                theme.font,
              )}
              style={{ minHeight: "297mm", margin: "0 auto" }}
            >
              {/* Cover Page */}
              <div
                className={cn(
                  "pt-20 pb-32 flex flex-col items-center text-center",
                  theme.borderWidth,
                )}
                style={{ borderTopColor: secondaryColor }}
              >
                <div
                  className="w-16 h-1 mb-8"
                  style={{ backgroundColor: primaryColor }}
                />
                <h1
                  className="text-4xl font-extrabold tracking-tight mb-6"
                  style={{ color: secondaryColor }}
                >
                  {result.title}
                </h1>
                {result.description && (
                  <p className="max-w-md text-xl text-slate-500 italic font-sans leading-relaxed">
                    {result.description}
                  </p>
                )}
                <div className="mt-auto pt-20 text-sm text-slate-400 font-sans uppercase tracking-[0.2em]">
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              <div className="html2pdf__page-break" />

              {/* Summary Box */}
              {result.summary && (
                <div
                  className={cn(
                    "my-12 p-6 border-l-4 rounded-r-lg font-sans",
                    result.theme === "midnight"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50",
                  )}
                  style={{ borderLeftColor: primaryColor }}
                >
                  <h3
                    className="font-bold uppercase tracking-wider text-xs mb-3"
                    style={{ color: primaryColor }}
                  >
                    Executive Summary
                  </h3>
                  <p className="leading-relaxed italic">{result.summary}</p>
                </div>
              )}

              {/* Main Sections */}
              <div
                className={cn(
                  "space-y-12 pb-20",
                  result.layout === "compact"
                    ? "space-y-6"
                    : result.layout === "spaced"
                      ? "space-y-20"
                      : "space-y-12",
                )}
              >
                {result.sections.map((section, idx) => (
                  <article key={idx} className="space-y-4 break-inside-avoid">
                    <div className="flex items-baseline gap-4 border-b border-slate-100 pb-2">
                      <span
                        className="font-bold font-sans"
                        style={{ color: primaryColor }}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <h2
                        className="text-2xl font-bold"
                        style={{ color: secondaryColor }}
                      >
                        {section.heading}
                      </h2>
                    </div>

                    <div className="text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                      {section.content}
                    </div>

                    {/* Subsections */}
                    {section.subsections && section.subsections.length > 0 && (
                      <div className="ml-8 mt-6 space-y-6 border-l-2 border-slate-50 pl-6">
                        {section.subsections.map((sub, subIdx) => (
                          <div
                            key={subIdx}
                            className="space-y-2 break-inside-avoid"
                          >
                            {sub.title && (
                              <h3 className="text-lg font-bold text-slate-800 font-sans flex items-center gap-2">
                                {sub.title}
                              </h3>
                            )}
                            <p className="text-sm text-slate-600 leading-relaxed font-sans font-normal">
                              {sub.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-8 border-t border-slate-100 mt-20 flex justify-between items-center text-[10px] text-slate-300 font-sans uppercase tracking-widest">
                <span>Wasp Code AI Insights</span>
                <span>Confidential • {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
