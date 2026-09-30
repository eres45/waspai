"use client";

import { useEffect, useState } from "react";
import { Button } from "ui/button";
import {
  Download,
  CheckCircle2,
  Loader2,
  PresentationIcon,
  PaletteIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "lib/utils";
import { ToolUIPart } from "ai";
import { resolvePresentationTheme } from "lib/ai/tools/presentation-themes";

interface SlideContent {
  type?: string;
  title?: string;
  [key: string]: any;
}

interface PresentationData {
  title: string;
  description: string;
  topic: string;
  theme: string;
  slides: SlideContent[];
}

/** Renders a single slide preview mini-card using theme colors */
function SlidePreviewCard({
  slide,
  idx,
  theme,
  isActive,
  onClick,
}: {
  slide: SlideContent;
  idx: number;
  theme: ReturnType<typeof resolvePresentationTheme>;
  isActive: boolean;
  onClick: () => void;
}) {
  const slideType = slide?.type || (idx === 0 ? "cover" : "bullet-list");
  const slideTitle = slide?.title || slide?.heading || `Slide ${idx + 1}`;
  const points =
    slide?.points && Array.isArray(slide.points)
      ? slide.points
      : typeof slide?.content === "string"
        ? slide.content
            .split("\n")
            .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
            .filter(Boolean)
        : Array.isArray(slide?.content)
          ? slide.content
          : [];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 cursor-pointer",
        isActive
          ? "ring-2 scale-105 shadow-xl"
          : "opacity-60 hover:opacity-90 hover:scale-[1.02]",
      )}
      style={{
        width: 120,
        height: 68,
        background: theme.bg,
        outline: isActive ? `2px solid ${theme.accent}` : undefined,
        outlineOffset: "1px",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: theme.accent }}
      />
      {/* Slide number */}
      <div
        className="absolute top-1.5 right-2 text-[8px] font-bold"
        style={{ color: theme.accent, opacity: 0.8 }}
      >
        {idx + 1}
      </div>
      {/* Slide type badge */}
      <div
        className="absolute bottom-1 left-1.5 text-[6px] uppercase tracking-widest font-medium opacity-50"
        style={{ color: theme.muted }}
      >
        {slideType.replace(/-/g, " ")}
      </div>
      {/* Slide title */}
      <div className="absolute inset-0 flex flex-col justify-center px-2 pt-2.5">
        <p
          className="text-[8px] font-bold leading-tight line-clamp-2"
          style={{
            color: slideType === "cover" ? theme.text : theme.accent,
          }}
        >
          {slideTitle}
        </p>
        {slide?.subtitle && (
          <p
            className="text-[6.5px] mt-0.5 leading-tight opacity-70 truncate"
            style={{ color: theme.muted }}
          >
            {slide.subtitle}
          </p>
        )}
        {slide?.stat && (
          <p
            className="text-[14px] font-black leading-none mt-0.5"
            style={{ color: theme.accent }}
          >
            {slide.stat}
          </p>
        )}
        {points.length > 0 && (
          <div className="mt-0.5 flex flex-col gap-[2px]">
            {points.slice(0, 2).map((p: any, pIdx: number) => (
              <p
                key={pIdx}
                className="text-[6px] truncate opacity-70"
                style={{ color: theme.text }}
              >
                · {typeof p === "string" ? p : JSON.stringify(p)}
              </p>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

/** Renders the large "active slide" preview in the main area */
function SlideDetailView({
  slide,
  idx,
  total,
  theme,
}: {
  slide: SlideContent;
  idx: number;
  total: number;
  theme: ReturnType<typeof resolvePresentationTheme>;
}) {
  const slideType = slide?.type || (idx === 0 ? "cover" : "bullet-list");
  const slideTitle = slide?.title || slide?.heading || `Slide ${idx + 1}`;
  const points =
    slide?.points && Array.isArray(slide.points) && slide.points.length > 0
      ? slide.points
      : typeof slide?.content === "string"
        ? slide.content
            .split("\n")
            .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
            .filter(Boolean)
        : Array.isArray(slide?.content)
          ? slide.content
          : [];

  const renderContent = () => {
    switch (slideType) {
      case "cover":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <p
              className="text-2xl font-black leading-tight"
              style={{ color: theme.text }}
            >
              {slideTitle}
            </p>
            {slide?.subtitle && (
              <p className="text-sm" style={{ color: theme.muted }}>
                {slide.subtitle}
              </p>
            )}
            {slide?.tagline && (
              <div
                className="mt-1 px-4 py-1.5 rounded-full text-xs font-semibold border"
                style={{
                  background: theme.surface,
                  borderColor: theme.accent,
                  color: theme.accent,
                }}
              >
                {slide.tagline}
              </div>
            )}
          </div>
        );

      case "big-stat":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
            <p
              className="text-xs uppercase tracking-widest"
              style={{ color: theme.muted }}
            >
              {slideTitle}
            </p>
            <p className="text-6xl font-black" style={{ color: theme.accent }}>
              {slide?.stat}
            </p>
            {slide?.description && (
              <p className="text-sm max-w-xs" style={{ color: theme.text }}>
                {slide.description}
              </p>
            )}
          </div>
        );

      case "quote":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <p
              className="text-4xl font-black leading-none"
              style={{ color: theme.accent }}
            >
              &ldquo;
            </p>
            <p
              className="text-base font-semibold italic leading-relaxed"
              style={{ color: theme.text }}
            >
              &ldquo;{slide?.quote}&rdquo;
            </p>
            {slide?.attribution && (
              <p className="text-xs" style={{ color: theme.muted }}>
                — {slide.attribution}
              </p>
            )}
          </div>
        );

      case "two-column":
        return (
          <div className="flex flex-col h-full px-4 pt-3 pb-2 gap-2">
            <p className="text-sm font-bold" style={{ color: theme.text }}>
              {slideTitle}
            </p>
            <div className="flex gap-3 flex-1">
              {[slide?.left, slide?.right].map(
                (col: any, cIdx: number) =>
                  col && (
                    <div
                      key={cIdx}
                      className="flex-1 rounded-lg p-3 flex flex-col gap-1"
                      style={{
                        background: theme.surface,
                        borderLeft: `3px solid ${cIdx === 0 ? theme.accent : theme.secondary}`,
                      }}
                    >
                      <p
                        className="text-xs font-bold"
                        style={{
                          color: cIdx === 0 ? theme.accent : theme.secondary,
                        }}
                      >
                        {col.heading}
                      </p>
                      {(col.points || [])
                        .slice(0, 3)
                        .map((p: string, pIdx: number) => (
                          <p
                            key={pIdx}
                            className="text-[10px]"
                            style={{ color: theme.text }}
                          >
                            · {p}
                          </p>
                        ))}
                    </div>
                  ),
              )}
            </div>
          </div>
        );

      case "three-column":
        return (
          <div className="flex flex-col h-full px-4 pt-3 pb-2 gap-2">
            <p className="text-sm font-bold" style={{ color: theme.text }}>
              {slideTitle}
            </p>
            <div className="flex gap-2 flex-1">
              {(slide?.columns || [])
                .slice(0, 3)
                .map((col: any, cIdx: number) => (
                  <div
                    key={cIdx}
                    className="flex-1 rounded-lg p-2.5 flex flex-col gap-1"
                    style={{
                      background: theme.surface,
                      borderTop: `3px solid ${theme.accent}`,
                    }}
                  >
                    <p
                      className="text-[10px] font-bold"
                      style={{ color: theme.accent }}
                    >
                      {col.heading}
                    </p>
                    {(col.points || [])
                      .slice(0, 2)
                      .map((p: string, pIdx: number) => (
                        <p
                          key={pIdx}
                          className="text-[9px]"
                          style={{ color: theme.text }}
                        >
                          · {p}
                        </p>
                      ))}
                  </div>
                ))}
            </div>
          </div>
        );

      case "timeline":
        return (
          <div className="flex flex-col h-full px-4 pt-3 pb-2 gap-2">
            <p className="text-sm font-bold" style={{ color: theme.text }}>
              {slideTitle}
            </p>
            <div className="flex gap-2 flex-1 items-center relative">
              <div
                className="absolute left-0 right-0 h-[2px]"
                style={{ background: theme.accent, top: "50%" }}
              />
              {(slide?.timeline || [])
                .slice(0, 5)
                .map((item: any, tIdx: number) => (
                  <div
                    key={tIdx}
                    className="flex-1 flex flex-col items-center gap-1 relative"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full border-2 z-10"
                      style={{
                        background: theme.bg,
                        borderColor: theme.accent,
                      }}
                    />
                    <p
                      className="text-[9px] font-bold text-center"
                      style={{ color: theme.accent }}
                    >
                      {item.year}
                    </p>
                    <p
                      className="text-[8px] text-center leading-tight"
                      style={{ color: theme.muted }}
                    >
                      {item.event}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        );

      case "checklist":
        return (
          <div className="flex flex-col h-full px-4 pt-3 pb-2 gap-2">
            <p className="text-sm font-bold" style={{ color: theme.text }}>
              {slideTitle}
            </p>
            <div className="flex flex-col gap-1.5 flex-1 justify-center">
              {(slide?.items || [])
                .slice(0, 5)
                .map((item: any, iIdx: number) => (
                  <div
                    key={iIdx}
                    className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
                    style={{ background: theme.surface }}
                  >
                    <span
                      className="text-sm"
                      style={{
                        color: item.checked ? theme.secondary : theme.muted,
                      }}
                    >
                      {item.checked ? "✓" : "○"}
                    </span>
                    <p className="text-[10px]" style={{ color: theme.text }}>
                      {item.text}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        );

      case "call-to-action":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <p className="text-xl font-black" style={{ color: theme.accent }}>
              {slide?.heading || slideTitle}
            </p>
            {slide?.description && (
              <p className="text-xs max-w-xs" style={{ color: theme.text }}>
                {slide.description}
              </p>
            )}
            <div
              className="px-5 py-2 rounded-full text-sm font-bold"
              style={{ background: theme.accent, color: theme.bg }}
            >
              {slide?.cta || "Get Started"}
            </div>
          </div>
        );

      default: // bullet-list + content-with-icon
        return (
          <div className="flex flex-col h-full px-4 pt-3 pb-2 gap-2">
            <div className="flex items-center gap-2">
              <div
                className="w-[3px] h-6 rounded-full flex-shrink-0"
                style={{ background: theme.accent }}
              />
              <p className="text-sm font-bold" style={{ color: theme.text }}>
                {slideTitle}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 justify-center">
              {points.slice(0, 5).map((p: any, pIdx: number) => (
                <div
                  key={pIdx}
                  className="flex items-start gap-2 rounded-md px-2.5 py-1.5"
                  style={{ background: theme.surface }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                    style={{ background: theme.accent }}
                  />
                  <p
                    className="text-[10px] leading-snug"
                    style={{ color: theme.text }}
                  >
                    {typeof p === "string" ? p : JSON.stringify(p)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden flex-1"
      style={{
        background: theme.bg,
        minHeight: 220,
        border: `1px solid ${theme.surface}`,
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: theme.accent }}
      />
      {/* Slide number badge */}
      <div
        className="absolute top-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded"
        style={{ color: theme.accent, background: theme.surface }}
      >
        {idx + 1} / {total}
      </div>

      {renderContent()}
    </div>
  );
}

export function PresentationGeneratorToolInvocation({
  part,
}: {
  part: ToolUIPart;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [hasDownloaded, setHasDownloaded] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      sessionStorage.getItem(`pptx-downloaded-${part.toolCallId}`) === "true"
    );
  });

  const result =
    part.state === "output-available" ? (part.output as any) : null;
  const data = result as (PresentationData & { success: boolean }) | null;
  const theme = resolvePresentationTheme(data?.theme);

  const handleExport = async () => {
    if (!data) return;
    try {
      setIsGenerating(true);

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

  // Auto-trigger download
  useEffect(() => {
    if (result?.success && !hasDownloaded && !isGenerating) {
      handleExport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.success]);

  if (!data) return null;

  const slides = (data.slides || []).filter(Boolean);
  if (slides.length === 0) return null;

  const activeSlide = slides[activeSlideIdx] || slides[0];
  const isDark = theme.scheme === "dark";

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-2xl shadow-2xl border max-w-2xl mx-auto overflow-hidden"
      style={{
        background: isDark ? "#18181b" : "#f8f8f6",
        borderColor: isDark ? "#27272a" : "#e5e5e0",
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-xl"
            style={{ background: `${theme.accent}18` }}
          >
            <PresentationIcon
              className="size-5"
              style={{ color: theme.accent }}
            />
          </div>
          <div>
            <h3
              className={cn(
                "text-sm font-bold leading-tight",
                isDark ? "text-white" : "text-zinc-900",
              )}
            >
              {data.title}
            </h3>
            <p
              className={cn(
                "text-xs mt-0.5",
                isDark ? "text-zinc-400" : "text-zinc-500",
              )}
            >
              {data.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <PaletteIcon
            className={cn("size-3", isDark ? "text-zinc-500" : "text-zinc-400")}
          />
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border",
              theme.badgeClass,
            )}
          >
            {theme.name}
          </span>
        </div>
      </div>

      {/* Main slide preview */}
      <div className="flex flex-col gap-2">
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1",
            isDark ? "text-zinc-500" : "text-zinc-400",
          )}
        >
          <Sparkles className="size-2.5 text-amber-500" />
          Slide Preview — {slides.length} slides
        </p>

        {activeSlide && (
          <SlideDetailView
            slide={activeSlide}
            idx={activeSlideIdx}
            total={slides.length}
            theme={theme}
          />
        )}

        {/* Navigation controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSlideIdx((i) => Math.max(0, i - 1))}
            disabled={activeSlideIdx === 0}
            className="p-1 rounded-md disabled:opacity-30 transition-opacity hover:opacity-80"
            style={{ background: theme.surface, color: theme.text }}
          >
            <ChevronLeft className="size-4" />
          </button>

          {/* Thumbnail strip */}
          <div
            className="flex-1 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <div className="flex gap-1.5 py-0.5">
              {slides.map((slide, idx) => (
                <SlidePreviewCard
                  key={idx}
                  slide={slide}
                  idx={idx}
                  theme={theme}
                  isActive={idx === activeSlideIdx}
                  onClick={() => setActiveSlideIdx(idx)}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() =>
              setActiveSlideIdx((i) => Math.min(slides.length - 1, i + 1))
            }
            disabled={activeSlideIdx === slides.length - 1}
            className="p-1 rounded-md disabled:opacity-30 transition-opacity hover:opacity-80"
            style={{ background: theme.surface, color: theme.text }}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Download button */}
      <Button
        onClick={handleExport}
        disabled={isGenerating}
        className="w-full rounded-xl h-10 font-semibold shadow-lg transition-all border-none text-sm"
        style={{
          background: theme.accent,
          color: isDark ? "#000" : "#fff",
          boxShadow: `0 4px 14px ${theme.accent}44`,
        }}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 animate-spin size-4" />
            Designing Presentation…
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
  );
}
