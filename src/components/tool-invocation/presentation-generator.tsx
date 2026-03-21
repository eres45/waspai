"use client";

import { useEffect, useState } from "react";
import { Button } from "ui/button";
import {
  Download,
  CheckCircle2,
  Loader2,
  PresentationIcon,
  LayoutIcon,
  PaletteIcon,
} from "lucide-react";
import pptxgen from "pptxgenjs";
import blobshape from "blobshape";
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

export function PresentationGeneratorToolInvocation({
  result,
}: {
  result?: PresentationData & { success: boolean };
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const data = result;
  const theme = data ? THEMES[data.theme] || THEMES.tech : THEMES.tech;

  const handleExport = async () => {
    if (!data) return;
    try {
      setIsGenerating(true);

      const prs = new pptxgen();
      prs.layout = "LAYOUT_WIDE";

      // Master slide template
      prs.defineSlideMaster({
        title: "MASTER",
        background: { color: theme.bg },
      });

      // Decorative Blob Helper
      const addDecorationBlobs = (slide: any, slideIndex: number) => {
        const positions = [
          { x: 8.5, y: -0.5, w: 2.5, h: 2.5 },
          { x: -0.3, y: 5.5, w: 2.8, h: 2.8 },
          { x: 8.0, y: 5.0, w: 2.0, h: 2.0 },
          { x: 0.5, y: 0.5, w: 2.2, h: 2.2 },
        ];

        for (let i = 0; i < theme.blobCount; i++) {
          const pos = positions[(i + slideIndex) % positions.length];
          const shape = blobshape({
            size: 200,
            growth: Math.random() * 4 + 3,
            edges: Math.random() * 8 + 6,
          });

          const svgXml = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="${theme.accent}" opacity="${theme.blobOpacity}" 
              d="${shape.path}" transform="translate(100 100)"/>
          </svg>`;

          const base64 = btoa(svgXml);
          slide.addImage({
            data: `image/svg+xml;base64,${base64}`,
            x: pos.x,
            y: pos.y,
            w: pos.w,
            h: pos.h,
          });
        }
      };

      // Slide Renderers
      data.slides.forEach((s, idx) => {
        const slide = prs.addSlide({ masterName: "MASTER" });
        addDecorationBlobs(slide, idx);

        // Slide number
        slide.addText(`${idx + 1}`, {
          x: 9.0,
          y: 6.9,
          w: 0.7,
          h: 0.3,
          fontSize: 11,
          color: theme.muted,
          fontFace: theme.font,
          align: "right",
        });

        switch (s.type) {
          case "cover":
            slide.addShape(prs.ShapeType.rect, {
              x: 0,
              y: 0,
              w: "100%",
              h: "70%",
              fill: { color: theme.accent },
            });
            slide.addText(s.title, {
              x: 0.5,
              y: 1.5,
              w: "90%",
              h: 2.0,
              fontSize: 44,
              bold: true,
              color: "#FFFFFF",
              fontFace: theme.titleFont,
              align: "center",
            });
            slide.addText(s.subtitle, {
              x: 0.5,
              y: 3.5,
              w: "90%",
              h: 1.0,
              fontSize: 24,
              color: theme.secondary,
              fontFace: theme.font,
              align: "center",
            });
            slide.addText(s.tagline, {
              x: 1.0,
              y: 6.0,
              w: "80%",
              h: 0.5,
              fontSize: 14,
              color: theme.muted,
              fontFace: theme.font,
              align: "center",
            });
            break;

          case "bullet-list":
            slide.addText(s.title, {
              x: 0.5,
              y: 0.5,
              w: "90%",
              h: 1.0,
              fontSize: 28,
              bold: true,
              color: theme.accent,
              fontFace: theme.titleFont,
            });
            slide.addShape(prs.ShapeType.rect, {
              x: 0.3,
              y: 0.5,
              w: 0.05,
              h: 1.0,
              fill: { color: theme.accent },
            });
            s.points.forEach((p: string, pIdx: number) => {
              slide.addShape(prs.ShapeType.ellipse, {
                x: 0.8,
                y: 1.8 + pIdx * 1.0,
                w: 0.15,
                h: 0.15,
                fill: { color: theme.accent },
              });
              slide.addText(p, {
                x: 1.1,
                y: 1.6 + pIdx * 1.0,
                w: "80%",
                h: 0.6,
                fontSize: 18,
                color: theme.text,
                fontFace: theme.font,
              });
            });
            break;

          case "two-column":
            slide.addText(s.title, {
              x: 0.5,
              y: 0.3,
              w: "90%",
              h: 0.8,
              fontSize: 28,
              color: theme.accent,
              fontFace: theme.titleFont,
            });
            slide.addShape(prs.ShapeType.line, {
              x: 5.0,
              y: 1.5,
              w: 0,
              h: 5.0,
              line: { color: theme.accent, width: 2 },
            });

            // Left
            slide.addShape(prs.ShapeType.rect, {
              x: 0.5,
              y: 1.5,
              w: 4.2,
              h: 5.0,
              fill: { color: "#1A1A2E", transparency: 50 },
              rectRadius: 0.1,
            });
            slide.addText(s.left.heading, {
              x: 0.7,
              y: 1.7,
              w: 3.8,
              h: 0.5,
              fontSize: 20,
              bold: true,
              color: theme.accent,
              fontFace: theme.titleFont,
            });
            s.left.points.forEach((p: string, pIdx: number) => {
              slide.addText(`• ${p}`, {
                x: 0.7,
                y: 2.3 + pIdx * 0.8,
                w: 3.8,
                h: 0.6,
                fontSize: 16,
                color: theme.text,
                fontFace: theme.font,
              });
            });

            // Right
            slide.addShape(prs.ShapeType.rect, {
              x: 5.3,
              y: 1.5,
              w: 4.2,
              h: 5.0,
              fill: { color: "#1A1A2E", transparency: 50 },
              rectRadius: 0.1,
            });
            slide.addText(s.right.heading, {
              x: 5.5,
              y: 1.7,
              w: 3.8,
              h: 0.5,
              fontSize: 20,
              bold: true,
              color: theme.accent,
              fontFace: theme.titleFont,
            });
            s.right.points.forEach((p: string, pIdx: number) => {
              slide.addText(`• ${p}`, {
                x: 5.5,
                y: 2.3 + pIdx * 0.8,
                w: 3.8,
                h: 0.6,
                fontSize: 16,
                color: theme.text,
                fontFace: theme.font,
              });
            });
            break;

          case "big-stat":
            slide.addShape(prs.ShapeType.rect, {
              x: 0,
              y: 0,
              w: "100%",
              h: "100%",
              fill: {
                type: "gradient",
                color: theme.bg,
                color2: theme.accent,
                angle: 45,
              } as any,
            });
            slide.addText(s.title, {
              x: 0,
              y: 1.5,
              w: "100%",
              h: 0.7,
              fontSize: 20,
              color: "#FFFFFF",
              fontFace: theme.font,
              align: "center",
            });
            slide.addText(s.stat, {
              x: 0,
              y: 2.5,
              w: "100%",
              h: 2.0,
              fontSize: 80,
              bold: true,
              color: theme.accent,
              fontFace: theme.titleFont,
              align: "center",
            });
            slide.addText(s.description, {
              x: 2.0,
              y: 5.0,
              w: 6.0,
              h: 0.8,
              fontSize: 16,
              color: "#FFFFFF",
              fontFace: theme.font,
              align: "center",
            });
            break;

          case "three-column":
            slide.addText(s.title, {
              x: 0.5,
              y: 0.3,
              w: "90%",
              h: 0.8,
              fontSize: 28,
              color: theme.accent,
              fontFace: theme.titleFont,
            });
            s.columns.forEach((col: any, cIdx: number) => {
              const xPos = 0.5 + cIdx * 3.2;
              slide.addShape(prs.ShapeType.rect, {
                x: xPos,
                y: 1.5,
                w: 3.0,
                h: 5.0,
                fill: { color: "#1A1A2E", transparency: 50 },
                rectRadius: 0.1,
              });
              slide.addShape(prs.ShapeType.rect, {
                x: xPos,
                y: 1.5,
                w: 3.0,
                h: 0.1,
                fill: { color: theme.accent },
              });
              slide.addText(col.heading, {
                x: xPos + 0.2,
                y: 1.8,
                w: 2.6,
                h: 0.5,
                fontSize: 18,
                bold: true,
                color: theme.accent,
                fontFace: theme.titleFont,
              });
              col.points.forEach((p: string, pIdx: number) => {
                slide.addText(`• ${p}`, {
                  x: xPos + 0.2,
                  y: 2.4 + pIdx * 0.8,
                  w: 2.6,
                  h: 0.7,
                  fontSize: 14,
                  color: theme.text,
                  fontFace: theme.font,
                });
              });
            });
            break;

          case "timeline":
            slide.addText(s.title, {
              x: 0.5,
              y: 0.5,
              w: "90%",
              h: 0.8,
              fontSize: 28,
              color: theme.accent,
              fontFace: theme.titleFont,
            });
            slide.addShape(prs.ShapeType.line, {
              x: 1.0,
              y: 4.0,
              w: 8.0,
              h: 0,
              line: { color: theme.accent, width: 3 },
            });
            s.timeline.forEach((item: any, tIdx: number) => {
              const xPos = 1.0 + tIdx * (8.0 / (s.timeline.length - 1));
              const isTop = tIdx % 2 === 0;
              slide.addShape(prs.ShapeType.ellipse, {
                x: xPos - 0.1,
                y: 3.9,
                w: 0.2,
                h: 0.2,
                fill: { color: theme.accent },
              });
              slide.addText(item.year, {
                x: xPos - 0.5,
                y: isTop ? 3.0 : 4.4,
                w: 1.0,
                h: 0.4,
                fontSize: 18,
                bold: true,
                color: theme.accent,
                align: "center",
              });
              slide.addText(item.event, {
                x: xPos - 0.8,
                y: isTop ? 2.3 : 4.9,
                w: 1.6,
                h: 0.7,
                fontSize: 14,
                color: theme.text,
                align: "center",
              });
            });
            break;

          case "quote":
            slide.addShape(prs.ShapeType.rect, {
              x: 0,
              y: 0,
              w: "100%",
              h: "100%",
              fill: { color: theme.accent, transparency: 70 },
            });
            slide.addText(`"${s.quote}"`, {
              x: 1.0,
              y: 2.5,
              w: 8.0,
              h: 2.0,
              fontSize: 36,
              italic: true,
              bold: true,
              color: "#FFFFFF",
              fontFace: theme.font,
              align: "center",
            });
            slide.addText(s.attribution, {
              x: 1.0,
              y: 4.5,
              w: 8.0,
              h: 0.5,
              fontSize: 18,
              color: theme.muted,
              fontFace: theme.font,
              align: "right",
            });
            break;

          case "checklist":
            slide.addText(s.title, {
              x: 0.5,
              y: 0.5,
              w: "90%",
              h: 0.8,
              fontSize: 28,
              color: theme.accent,
              fontFace: theme.titleFont,
            });
            s.items.forEach((item: any, iIdx: number) => {
              slide.addText(item.checked ? "✓" : "○", {
                x: 1.0,
                y: 1.8 + iIdx * 0.7,
                w: 0.5,
                h: 0.5,
                fontSize: 20,
                color: item.checked ? "#4CAF50" : theme.muted,
                bold: true,
              });
              slide.addText(item.text, {
                x: 1.6,
                y: 1.8 + iIdx * 0.7,
                w: 7.0,
                h: 0.5,
                fontSize: 16,
                color: "#FFFFFF",
                fontFace: theme.font,
              });
            });
            break;

          case "content-with-icon":
            slide.addShape(prs.ShapeType.ellipse, {
              x: 0.8,
              y: 2.5,
              w: 2.0,
              h: 2.0,
              fill: { color: theme.accent, transparency: 90 },
            });
            slide.addText(s.icon, {
              x: 1.0,
              y: 2.7,
              w: 1.6,
              h: 1.6,
              fontSize: 44,
              align: "center",
            });
            slide.addText(s.title, {
              x: 3.5,
              y: 2.5,
              w: 6.0,
              h: 0.7,
              fontSize: 28,
              bold: true,
              color: theme.accent,
              fontFace: theme.titleFont,
            });
            slide.addText(s.content, {
              x: 3.5,
              y: 3.3,
              w: 6.0,
              h: 2.5,
              fontSize: 16,
              color: theme.text,
              fontFace: theme.font,
            });
            break;

          case "call-to-action":
            slide.addShape(prs.ShapeType.rect, {
              x: 0,
              y: 0,
              w: "100%",
              h: "100%",
              fill: {
                type: "gradient",
                color: "#000000",
                color2: theme.bg,
                angle: 90,
              } as any,
            });
            slide.addText(s.heading, {
              x: 0,
              y: 2.0,
              w: "100%",
              h: 1.0,
              fontSize: 36,
              bold: true,
              color: theme.accent,
              fontFace: theme.titleFont,
              align: "center",
            });
            slide.addText(s.description, {
              x: 1.0,
              y: 3.2,
              w: 8.0,
              h: 0.8,
              fontSize: 16,
              color: "#FFFFFF",
              fontFace: theme.font,
              align: "center",
            });
            slide.addShape(prs.ShapeType.rect, {
              x: 4.0,
              y: 4.5,
              w: 2.0,
              h: 0.6,
              fill: { color: theme.accent },
              rectRadius: 0.1,
            });
            slide.addText(s.cta, {
              x: 4.0,
              y: 4.5,
              w: 2.0,
              h: 0.6,
              fontSize: 20,
              bold: true,
              color: "#FFFFFF",
              fontFace: theme.font,
              align: "center",
            });
            break;
        }
      });

      await prs.writeFile({ fileName: `${data.title}.pptx` });

      setHasDownloaded(true);
      toast.success("Presentation ready! 🚀");
    } catch (error) {
      console.error("PPTX Generation Error:", error);
      toast.error("Failed to generate presentation.");
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

      <div className="grid grid-cols-2 gap-4 my-2">
        <div className="flex items-center gap-2 p-3 bg-white/5 border rounded-xl shadow-sm">
          <PresentationIcon className="size-4 text-primary" />
          <span className="text-sm font-medium">10 Professional Slides</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-white/5 border rounded-xl shadow-sm">
          <LayoutIcon className="size-4 text-primary" />
          <span className="text-sm font-medium">Smart Layouts</span>
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
              Presentation Downloaded
            </>
          ) : (
            <>
              <Download className="mr-2 size-4" />
              Download PowerPoint (.pptx)
            </>
          )}
        </Button>
      </div>

      <style jsx>{`
        .bg-card {
           background-image: linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(0,0,0,0.1));
        }
      `}</style>
    </div>
  );
}
