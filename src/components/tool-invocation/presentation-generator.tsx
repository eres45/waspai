"use client";

import { useEffect, useState } from "react";
import { Button } from "ui/button";
import {
  Download,
  CheckCircle2,
  Loader2,
  PresentationIcon,
  PaletteIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "lib/utils";

interface SlideContent {
  type: string;
  title: string;
  [key: string]: any;
}

interface PresentationData {
  title: string;
  description: string;
  topic: string;
  theme: keyof typeof THEMES;
  slides: SlideContent[];
}

const THEMES = {
  tech: {
    bg: "#0F0F1A",
    accent: "#00D4FF",
    secondary: "#FF00FF",
    text: "#FFFFFF",
    muted: "#888899",
    font: "Calibri",
    titleFont: "Arial",
    blobStyle: "geometric",
    blobCount: 2,
    blobOpacity: 0.15,
  },
  business: {
    bg: "#1A1A2E",
    accent: "#FF6B35",
    secondary: "#FFB300",
    text: "#FFFFFF",
    muted: "#AAAAAA",
    font: "Calibri",
    titleFont: "Arial",
    blobStyle: "minimal",
    blobCount: 1,
    blobOpacity: 0.08,
  },
  creative: {
    bg: "#1A0A2E",
    accent: "#FF00FF",
    secondary: "#00FFFF",
    text: "#FFFFFF",
    muted: "#CCCCCC",
    font: "Verdana",
    titleFont: "Impact",
    blobStyle: "colorful",
    blobCount: 4,
    blobOpacity: 0.25,
  },
  education: {
    bg: "#1A1209",
    accent: "#FFB300",
    secondary: "#FF6B35",
    text: "#FFFFFF",
    muted: "#BBBBBB",
    font: "Georgia",
    titleFont: "Georgia",
    blobStyle: "organic",
    blobCount: 2,
    blobOpacity: 0.12,
  },
  nature: {
    bg: "#0D1F0D",
    accent: "#4CAF50",
    secondary: "#8BC34A",
    text: "#FFFFFF",
    muted: "#99AA99",
    font: "Verdana",
    titleFont: "Georgia",
    blobStyle: "organic-waves",
    blobCount: 3,
    blobOpacity: 0.18,
  },
  medical: {
    bg: "#0A1628",
    accent: "#00BCD4",
    secondary: "#4DD0E1",
    text: "#FFFFFF",
    muted: "#999999",
    font: "Calibri",
    titleFont: "Arial",
    blobStyle: "geometric",
    blobCount: 1,
    blobOpacity: 0.1,
  },
  energy: {
    bg: "#1A0A00",
    accent: "#FF3D00",
    secondary: "#FF9100",
    text: "#FFFFFF",
    muted: "#CC9999",
    font: "Impact",
    titleFont: "Impact",
    blobStyle: "sharp",
    blobCount: 3,
    blobOpacity: 0.2,
  },
  elegant: {
    bg: "#0D0D0D",
    accent: "#C0A060",
    secondary: "#D4AF37",
    text: "#FFFFFF",
    muted: "#888888",
    font: "Georgia",
    titleFont: "Georgia",
    blobStyle: "minimal",
    blobCount: 1,
    blobOpacity: 0.06,
  },
};

import { ToolUIPart } from "ai";

export function PresentationGeneratorToolInvocation({
  part,
}: {
  part: ToolUIPart;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      sessionStorage.getItem(`pptx-downloaded-${part.toolCallId}`) === "true"
    );
  });

  const result =
    part.state === "output-available" ? (part.output as any) : null;
  const data = result as (PresentationData & { success: boolean }) | null;
  const theme = data ? THEMES[data.theme] || THEMES.tech : THEMES.tech;

  const handleExport = async () => {
    if (!data) return;
    try {
      setIsGenerating(true);

      // Call server-side API where pptxgenjs runs in proper Node.js context
      const res = await fetch("/api/generate-presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          topic: data.topic,
          theme: data.theme,
          slides: data.slides,
        }),
      });

      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Unknown server error" }));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.title || "presentation"}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setHasDownloaded(true);
      sessionStorage.setItem(`pptx-downloaded-${part.toolCallId}`, "true");
      toast.success("Presentation downloaded! 🚀");
    } catch (error: any) {
      console.error("PPTX Generation Error:", error);
      toast.error(
        `Failed to generate presentation: ${error?.message || "unknown error"}`,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-trigger download (useEffect must come after handleExport is defined)
  useEffect(() => {
    if (result?.success && !hasDownloaded && !isGenerating) {
      handleExport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.success]);

  if (!data) return null;

  return (
    <div className="flex flex-col gap-4 p-6 bg-card border rounded-2xl shadow-xl max-w-2xl mx-auto overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 rounded-xl">
            <PresentationIcon className="size-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{data.title}</h3>
            <p className="text-sm text-muted-foreground">{data.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PaletteIcon className="size-4 text-muted-foreground" />
          <span
            className={cn(
              "text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wider border shadow-sm",
              {
                "bg-blue-500/10 text-blue-500 border-blue-500/20":
                  data.theme === "tech",
                "bg-orange-500/10 text-orange-500 border-orange-500/20":
                  data.theme === "business",
                "bg-purple-500/10 text-purple-500 border-purple-500/20":
                  data.theme === "creative",
                "bg-amber-500/10 text-amber-500 border-amber-500/20":
                  data.theme === "education",
                "bg-green-500/10 text-green-500 border-green-500/20":
                  data.theme === "nature",
                "bg-cyan-500/10 text-cyan-500 border-cyan-500/20":
                  data.theme === "medical",
                "bg-red-500/10 text-red-500 border-red-500/20":
                  data.theme === "energy",
                "bg-neutral-500/10 text-neutral-500 border-neutral-500/20":
                  data.theme === "elegant",
              },
            )}
          >
            {data.theme}
          </span>
        </div>
      </div>

      {/* Slide Preview */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Slide Preview — {data.slides.length} slides
          </p>
        </div>
        <div
          className="overflow-x-auto pb-2"
          style={{ scrollbarWidth: "thin" }}
        >
          <div className="flex gap-2" style={{ width: "max-content" }}>
            {data.slides.map((slide, idx) => (
              <div
                key={idx}
                className="relative rounded-lg overflow-hidden flex-shrink-0 border border-white/10 shadow-md"
                style={{
                  width: 160,
                  height: 90,
                  background: theme.bg,
                }}
              >
                {/* Accent top bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ background: theme.accent }}
                />

                {/* Slide number */}
                <div
                  className="absolute top-2 right-2 text-[9px] font-bold opacity-60"
                  style={{ color: theme.accent }}
                >
                  {idx + 1}
                </div>

                {/* Slide type badge */}
                <div
                  className="absolute bottom-1 left-2 text-[7px] uppercase tracking-widest opacity-50"
                  style={{ color: theme.muted }}
                >
                  {slide.type.replace(/-/g, " ")}
                </div>

                {/* Slide title */}
                <div className="absolute inset-0 flex flex-col justify-center px-3 pt-3">
                  <p
                    className="text-[10px] font-bold leading-tight line-clamp-2"
                    style={{
                      color: slide.type === "cover" ? "#fff" : theme.accent,
                    }}
                  >
                    {slide.title ||
                      (slide as any).heading ||
                      (slide as any).quote?.slice(0, 40) ||
                      ""}
                  </p>
                  {(slide as any).subtitle && (
                    <p
                      className="text-[8px] mt-0.5 leading-tight opacity-70 truncate"
                      style={{ color: theme.text }}
                    >
                      {(slide as any).subtitle}
                    </p>
                  )}
                  {(slide as any).stat && (
                    <p
                      className="text-[22px] font-black leading-none mt-1"
                      style={{ color: theme.accent }}
                    >
                      {(slide as any).stat}
                    </p>
                  )}
                  {(slide as any).points && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      {((slide as any).points as string[])
                        .slice(0, 2)
                        .map((p, pIdx) => (
                          <p
                            key={pIdx}
                            className="text-[7px] opacity-60 truncate"
                            style={{ color: theme.text }}
                          >
                            • {p}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleExport}
          disabled={isGenerating}
          className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all border-none"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 animate-spin size-4" />
              Designing Presentation...
            </>
          ) : hasDownloaded ? (
            <>
              <CheckCircle2 className="mr-2 size-4" />
              Download Again (.pptx)
            </>
          ) : (
            <>
              <Download className="mr-2 size-4" />
              Download PowerPoint (.pptx)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
