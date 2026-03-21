"use client";

import { ToolUIPart } from "ai";
import { FileIcon, Download, Loader2, Eye, EyeOff, Layout } from "lucide-react";
import { useMemo, useState, useRef } from "react";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface DocumentGeneratorProps {
  part: ToolUIPart;
}

interface DocumentData {
  success: boolean;
  title: string;
  description?: string;
  summary?: string;
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

  const handleExport = async () => {
    if (!reportRef.current || !result) return;

    setIsExporting(true);
    try {
      // Dynamic import to avoid SSR issues
      const html2pdf = (await import("html2pdf.js" as any)).default;

      const opt = {
        margin: [15, 15],
        filename: result.filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      await html2pdf().set(opt).from(reportRef.current).save();
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Failed to generate PDF. Please try again.");
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
            <p className="text-xs text-muted-foreground">
              Professional Report • {result.sections.length} Sections
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
              className="h-8 gap-2"
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

      {/* Professional Document Preview */}
      {isPreviewOpen && (
        <div className="mt-4 rounded-xl border border-border/50 bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-slate-50 border-b border-border/50 px-4 py-2 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Document Preview
            </span>
            <Badge
              variant="outline"
              className="text-[10px] bg-orange-50 text-orange-600 border-orange-200"
            >
              A4 Format
            </Badge>
          </div>

          <div
            ref={reportRef}
            className="p-12 text-slate-900 bg-white font-serif max-h-[600px] overflow-y-auto"
            style={{ width: "100%", minHeight: "297mm" }}
          >
            {/* Cover Page */}
            <div className="border-t-[12px] border-[#0f172a] pt-20 pb-32 flex flex-col items-center text-center">
              <div className="w-16 h-1 bg-orange-500 mb-8" />
              <h1 className="text-4xl font-extrabold text-[#0f172a] tracking-tight mb-6">
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
              <div className="my-12 p-6 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg font-sans">
                <h3 className="text-orange-700 font-bold uppercase tracking-wider text-xs mb-3">
                  Executive Summary
                </h3>
                <p className="text-slate-800 leading-relaxed italic">
                  {result.summary}
                </p>
              </div>
            )}

            {/* Main Sections */}
            <div className="space-y-12 pb-20">
              {result.sections.map((section, idx) => (
                <article key={idx} className="space-y-4 break-inside-avoid">
                  <div className="flex items-baseline gap-4 border-b border-slate-100 pb-2">
                    <span className="text-orange-500 font-bold font-sans">
                      0{idx + 1}
                    </span>
                    <h2 className="text-2xl font-bold text-[#0f172a]">
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
                          <p className="text-sm text-slate-600 leading-relaxed font-sans">
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
      )}
    </div>
  );
}
