import { NextRequest, NextResponse } from "next/server";
import pptxgen from "pptxgenjs";

export const runtime = "nodejs";

const THEMES: Record<string, any> = {
  tech: {
    bg: "0F0F1A",
    accent: "00D4FF",
    secondary: "FF00FF",
    text: "FFFFFF",
    muted: "888899",
    font: "Calibri",
    titleFont: "Arial",
    blobCount: 2,
    blobOpacity: 0.15,
  },
  business: {
    bg: "1A1A2E",
    accent: "FF6B35",
    secondary: "FFB300",
    text: "FFFFFF",
    muted: "AAAAAA",
    font: "Calibri",
    titleFont: "Arial",
    blobCount: 1,
    blobOpacity: 0.08,
  },
  creative: {
    bg: "1A0A2E",
    accent: "FF00FF",
    secondary: "00FFFF",
    text: "FFFFFF",
    muted: "CCCCCC",
    font: "Verdana",
    titleFont: "Arial Black",
    blobCount: 4,
    blobOpacity: 0.25,
  },
  education: {
    bg: "1A1209",
    accent: "FFB300",
    secondary: "FF6B35",
    text: "FFFFFF",
    muted: "BBBBBB",
    font: "Georgia",
    titleFont: "Georgia",
    blobCount: 2,
    blobOpacity: 0.12,
  },
  nature: {
    bg: "0D1F0D",
    accent: "4CAF50",
    secondary: "8BC34A",
    text: "FFFFFF",
    muted: "99AA99",
    font: "Verdana",
    titleFont: "Georgia",
    blobCount: 3,
    blobOpacity: 0.18,
  },
  medical: {
    bg: "0A1628",
    accent: "00BCD4",
    secondary: "4DD0E1",
    text: "FFFFFF",
    muted: "999999",
    font: "Calibri",
    titleFont: "Arial",
    blobCount: 1,
    blobOpacity: 0.1,
  },
  energy: {
    bg: "1A0A00",
    accent: "FF3D00",
    secondary: "FF9100",
    text: "FFFFFF",
    muted: "CC9999",
    font: "Arial",
    titleFont: "Arial Black",
    blobCount: 3,
    blobOpacity: 0.2,
  },
  elegant: {
    bg: "0D0D0D",
    accent: "C0A060",
    secondary: "D4AF37",
    text: "FFFFFF",
    muted: "888888",
    font: "Georgia",
    titleFont: "Georgia",
    blobCount: 1,
    blobOpacity: 0.06,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, theme: themeName, slides } = body;

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: "Invalid slide data" },
        { status: 400 },
      );
    }

    const theme = THEMES[themeName] || THEMES.tech;

    const prs = new pptxgen();
    prs.layout = "LAYOUT_WIDE";

    prs.defineSlideMaster({
      title: "MASTER",
      background: { color: theme.bg },
    });

    slides.forEach((s: any, idx: number) => {
      const slide = prs.addSlide({ masterName: "MASTER" });

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
          slide.addText(s.title || "Untitled", {
            x: 0.5,
            y: 1.5,
            w: "90%",
            h: 2.0,
            fontSize: 44,
            bold: true,
            color: "FFFFFF",
            fontFace: theme.titleFont,
            align: "center",
          });
          if (s.subtitle)
            slide.addText(s.subtitle, {
              x: 0.5,
              y: 3.5,
              w: "90%",
              h: 1.0,
              fontSize: 24,
              color: "FFFFFF",
              fontFace: theme.font,
              align: "center",
            });
          if (s.tagline)
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
          slide.addText(s.title || "", {
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
          (s.points || []).forEach((p: string, pIdx: number) => {
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
          slide.addText(s.title || "", {
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
          slide.addText(s.left?.heading || "", {
            x: 0.7,
            y: 1.7,
            w: 3.8,
            h: 0.5,
            fontSize: 20,
            bold: true,
            color: theme.accent,
            fontFace: theme.titleFont,
          });
          (s.left?.points || []).forEach((p: string, pIdx: number) => {
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
          slide.addText(s.right?.heading || "", {
            x: 5.5,
            y: 1.7,
            w: 3.8,
            h: 0.5,
            fontSize: 20,
            bold: true,
            color: theme.accent,
            fontFace: theme.titleFont,
          });
          (s.right?.points || []).forEach((p: string, pIdx: number) => {
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
          slide.addText(s.title || "", {
            x: 0,
            y: 1.5,
            w: "100%",
            h: 0.7,
            fontSize: 20,
            color: "FFFFFF",
            fontFace: theme.font,
            align: "center",
          });
          slide.addText(s.stat || "", {
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
          slide.addText(s.description || "", {
            x: 2.0,
            y: 5.0,
            w: 6.0,
            h: 0.8,
            fontSize: 16,
            color: "FFFFFF",
            fontFace: theme.font,
            align: "center",
          });
          break;

        case "three-column":
          slide.addText(s.title || "", {
            x: 0.5,
            y: 0.3,
            w: "90%",
            h: 0.8,
            fontSize: 28,
            color: theme.accent,
            fontFace: theme.titleFont,
          });
          (s.columns || []).forEach((col: any, cIdx: number) => {
            const xPos = 0.5 + cIdx * 3.2;
            slide.addText(col.heading || "", {
              x: xPos + 0.2,
              y: 1.8,
              w: 2.6,
              h: 0.5,
              fontSize: 18,
              bold: true,
              color: theme.accent,
              fontFace: theme.titleFont,
            });
            (col.points || []).forEach((p: string, pIdx: number) => {
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
          slide.addText(s.title || "", {
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
          (s.timeline || []).forEach((item: any, tIdx: number) => {
            const count = Math.max(s.timeline.length - 1, 1);
            const xPos = 1.0 + tIdx * (8.0 / count);
            const isTop = tIdx % 2 === 0;
            slide.addShape(prs.ShapeType.ellipse, {
              x: xPos - 0.1,
              y: 3.9,
              w: 0.2,
              h: 0.2,
              fill: { color: theme.accent },
            });
            slide.addText(String(item.year || ""), {
              x: xPos - 0.5,
              y: isTop ? 3.0 : 4.4,
              w: 1.0,
              h: 0.4,
              fontSize: 18,
              bold: true,
              color: theme.accent,
              align: "center",
            });
            slide.addText(String(item.event || ""), {
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
          slide.addText(`"${s.quote || ""}"`, {
            x: 1.0,
            y: 2.5,
            w: 8.0,
            h: 2.0,
            fontSize: 36,
            italic: true,
            bold: true,
            color: "FFFFFF",
            fontFace: theme.font,
            align: "center",
          });
          slide.addText(s.attribution || "", {
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
          slide.addText(s.title || "", {
            x: 0.5,
            y: 0.5,
            w: "90%",
            h: 0.8,
            fontSize: 28,
            color: theme.accent,
            fontFace: theme.titleFont,
          });
          (s.items || []).forEach((item: any, iIdx: number) => {
            slide.addText(item.checked ? "✓" : "○", {
              x: 1.0,
              y: 1.8 + iIdx * 0.7,
              w: 0.5,
              h: 0.5,
              fontSize: 20,
              color: item.checked ? "4CAF50" : theme.muted,
              bold: true,
            });
            slide.addText(item.text || "", {
              x: 1.6,
              y: 1.8 + iIdx * 0.7,
              w: 7.0,
              h: 0.5,
              fontSize: 16,
              color: "FFFFFF",
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
          slide.addText(s.icon || "★", {
            x: 1.0,
            y: 2.7,
            w: 1.6,
            h: 1.6,
            fontSize: 44,
            align: "center",
          });
          slide.addText(s.title || "", {
            x: 3.5,
            y: 2.5,
            w: 6.0,
            h: 0.7,
            fontSize: 28,
            bold: true,
            color: theme.accent,
            fontFace: theme.titleFont,
          });
          slide.addText(s.content || "", {
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
          slide.addText(s.heading || s.title || "", {
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
          slide.addText(s.description || "", {
            x: 1.0,
            y: 3.2,
            w: 8.0,
            h: 0.8,
            fontSize: 16,
            color: "FFFFFF",
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
          slide.addText(s.cta || "Get Started", {
            x: 4.0,
            y: 4.5,
            w: 2.0,
            h: 0.6,
            fontSize: 20,
            bold: true,
            color: "FFFFFF",
            fontFace: theme.font,
            align: "center",
          });
          break;

        default:
          // Fallback: just show the title
          slide.addText(s.title || s.heading || String(s.type), {
            x: 0.5,
            y: 2.5,
            w: "90%",
            h: 1.5,
            fontSize: 28,
            color: theme.accent,
            fontFace: theme.titleFont,
            align: "center",
          });
      }
    });

    const buffer = (await prs.write({
      outputType: "nodebuffer",
    })) as Uint8Array;
    const responseBlob = new Blob([buffer.buffer as ArrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });

    return new NextResponse(responseBlob, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(title || "presentation")}.pptx"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err: any) {
    console.error("[generate-presentation]", err);
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
