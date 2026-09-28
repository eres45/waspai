import { NextRequest, NextResponse } from "next/server";
import pptxgen from "pptxgenjs";
import {
  resolvePresentationTheme,
  stripHex,
} from "lib/ai/tools/presentation-themes";

export const runtime = "nodejs";

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

    const theme = resolvePresentationTheme(themeName);
    const bgHex = stripHex(theme.bg);
    const accentHex = stripHex(theme.accent);
    const secondaryHex = stripHex(theme.secondary);
    const textHex = stripHex(theme.text);
    const mutedHex = stripHex(theme.muted);
    const surfaceHex = stripHex(theme.surface);

    const prs = new pptxgen();
    prs.layout = "LAYOUT_WIDE";

    prs.defineSlideMaster({
      title: "MASTER",
      background: { color: bgHex },
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
        color: mutedHex,
        fontFace: theme.font,
        align: "right",
      });

      switch (s.type) {
        case "cover":
          // Modern branded banner / card styling
          slide.addShape(prs.ShapeType.rect, {
            x: 0,
            y: 0,
            w: "100%",
            h: 0.15,
            fill: { color: accentHex },
          });

          // Title
          slide.addText(s.title || "Untitled", {
            x: 0.8,
            y: 1.8,
            w: 8.4,
            h: 2.2,
            fontSize: 44,
            bold: true,
            color: textHex,
            fontFace: theme.titleFont,
            align: "center",
          });

          // Subtitle
          if (s.subtitle) {
            slide.addText(s.subtitle, {
              x: 1.0,
              y: 4.1,
              w: 8.0,
              h: 1.2,
              fontSize: 22,
              color: mutedHex,
              fontFace: theme.font,
              align: "center",
            });
          }

          // Tagline badge
          if (s.tagline) {
            slide.addShape(prs.ShapeType.roundRect, {
              x: 2.5,
              y: 5.6,
              w: 5.0,
              h: 0.6,
              fill: { color: surfaceHex },
              line: { color: accentHex, width: 1 },
              rectRadius: 0.15,
            });
            slide.addText(s.tagline, {
              x: 2.5,
              y: 5.65,
              w: 5.0,
              h: 0.5,
              fontSize: 14,
              bold: true,
              color: accentHex,
              fontFace: theme.font,
              align: "center",
            });
          }
          break;

        case "bullet-list":
          // Section header with vertical accent bar
          slide.addShape(prs.ShapeType.rect, {
            x: 0.8,
            y: 0.6,
            w: 0.1,
            h: 0.8,
            fill: { color: accentHex },
          });
          slide.addText(s.title || "", {
            x: 1.1,
            y: 0.5,
            w: 8.0,
            h: 1.0,
            fontSize: 28,
            bold: true,
            color: textHex,
            fontFace: theme.titleFont,
          });

          // Bullet items
          (s.points || []).forEach((p: string, pIdx: number) => {
            slide.addShape(prs.ShapeType.roundRect, {
              x: 0.8,
              y: 1.8 + pIdx * 1.1,
              w: 8.4,
              h: 0.9,
              fill: { color: surfaceHex },
              rectRadius: 0.08,
            });
            slide.addShape(prs.ShapeType.ellipse, {
              x: 1.1,
              y: 2.15 + pIdx * 1.1,
              w: 0.15,
              h: 0.15,
              fill: { color: accentHex },
            });
            slide.addText(p, {
              x: 1.4,
              y: 1.95 + pIdx * 1.1,
              w: 7.6,
              h: 0.6,
              fontSize: 16,
              color: textHex,
              fontFace: theme.font,
            });
          });
          break;

        case "two-column":
          slide.addText(s.title || "", {
            x: 0.8,
            y: 0.5,
            w: 8.4,
            h: 0.8,
            fontSize: 28,
            bold: true,
            color: textHex,
            fontFace: theme.titleFont,
          });

          // Left card
          slide.addShape(prs.ShapeType.roundRect, {
            x: 0.8,
            y: 1.6,
            w: 4.0,
            h: 4.8,
            fill: { color: surfaceHex },
            line: { color: accentHex, width: 1 },
            rectRadius: 0.1,
          });
          slide.addText(s.left?.heading || "", {
            x: 1.1,
            y: 1.9,
            w: 3.4,
            h: 0.5,
            fontSize: 20,
            bold: true,
            color: accentHex,
            fontFace: theme.titleFont,
          });
          (s.left?.points || []).forEach((p: string, pIdx: number) => {
            slide.addText(`• ${p}`, {
              x: 1.1,
              y: 2.6 + pIdx * 0.9,
              w: 3.4,
              h: 0.7,
              fontSize: 15,
              color: textHex,
              fontFace: theme.font,
            });
          });

          // Right card
          slide.addShape(prs.ShapeType.roundRect, {
            x: 5.2,
            y: 1.6,
            w: 4.0,
            h: 4.8,
            fill: { color: surfaceHex },
            line: { color: secondaryHex, width: 1 },
            rectRadius: 0.1,
          });
          slide.addText(s.right?.heading || "", {
            x: 5.5,
            y: 1.9,
            w: 3.4,
            h: 0.5,
            fontSize: 20,
            bold: true,
            color: secondaryHex,
            fontFace: theme.titleFont,
          });
          (s.right?.points || []).forEach((p: string, pIdx: number) => {
            slide.addText(`• ${p}`, {
              x: 5.5,
              y: 2.6 + pIdx * 0.9,
              w: 3.4,
              h: 0.7,
              fontSize: 15,
              color: textHex,
              fontFace: theme.font,
            });
          });
          break;

        case "big-stat":
          // Stat hero card
          slide.addShape(prs.ShapeType.roundRect, {
            x: 1.5,
            y: 1.2,
            w: 7.0,
            h: 4.8,
            fill: { color: surfaceHex },
            line: { color: accentHex, width: 1 },
            rectRadius: 0.15,
          });
          slide.addText(s.title || "", {
            x: 2.0,
            y: 1.6,
            w: 6.0,
            h: 0.7,
            fontSize: 22,
            color: mutedHex,
            fontFace: theme.font,
            align: "center",
          });
          slide.addText(s.stat || "", {
            x: 2.0,
            y: 2.4,
            w: 6.0,
            h: 2.0,
            fontSize: 80,
            bold: true,
            color: accentHex,
            fontFace: theme.titleFont,
            align: "center",
          });
          slide.addText(s.description || "", {
            x: 2.0,
            y: 4.6,
            w: 6.0,
            h: 1.0,
            fontSize: 17,
            color: textHex,
            fontFace: theme.font,
            align: "center",
          });
          break;

        case "three-column":
          slide.addText(s.title || "", {
            x: 0.8,
            y: 0.5,
            w: 8.4,
            h: 0.8,
            fontSize: 28,
            bold: true,
            color: textHex,
            fontFace: theme.titleFont,
          });
          (s.columns || []).forEach((col: any, cIdx: number) => {
            const xPos = 0.8 + cIdx * 2.9;
            slide.addShape(prs.ShapeType.roundRect, {
              x: xPos,
              y: 1.6,
              w: 2.65,
              h: 4.8,
              fill: { color: surfaceHex },
              line: { color: accentHex, width: 1 },
              rectRadius: 0.1,
            });
            slide.addText(col.heading || "", {
              x: xPos + 0.2,
              y: 1.9,
              w: 2.25,
              h: 0.6,
              fontSize: 18,
              bold: true,
              color: accentHex,
              fontFace: theme.titleFont,
            });
            (col.points || []).forEach((p: string, pIdx: number) => {
              slide.addText(`• ${p}`, {
                x: xPos + 0.2,
                y: 2.6 + pIdx * 0.9,
                w: 2.25,
                h: 0.7,
                fontSize: 14,
                color: textHex,
                fontFace: theme.font,
              });
            });
          });
          break;

        case "timeline":
          slide.addText(s.title || "", {
            x: 0.8,
            y: 0.5,
            w: 8.4,
            h: 0.8,
            fontSize: 28,
            bold: true,
            color: textHex,
            fontFace: theme.titleFont,
          });

          // Horizontal connector line
          slide.addShape(prs.ShapeType.line, {
            x: 1.0,
            y: 4.0,
            w: 8.0,
            h: 0,
            line: { color: accentHex, width: 3 },
          });

          const timelineList = Array.isArray(s.timeline) ? s.timeline : [];
          timelineList.forEach((item: any, tIdx: number) => {
            const count = Math.max(timelineList.length - 1, 1);
            const xPos = 1.0 + tIdx * (8.0 / count);
            const isTop = tIdx % 2 === 0;

            slide.addShape(prs.ShapeType.ellipse, {
              x: xPos - 0.12,
              y: 3.88,
              w: 0.24,
              h: 0.24,
              fill: { color: secondaryHex },
            });

            slide.addShape(prs.ShapeType.roundRect, {
              x: xPos - 0.9,
              y: isTop ? 1.8 : 4.4,
              w: 1.8,
              h: 1.8,
              fill: { color: surfaceHex },
              rectRadius: 0.08,
            });

            slide.addText(String(item.year || ""), {
              x: xPos - 0.8,
              y: isTop ? 2.0 : 4.6,
              w: 1.6,
              h: 0.4,
              fontSize: 16,
              bold: true,
              color: accentHex,
              align: "center",
            });
            slide.addText(String(item.event || ""), {
              x: xPos - 0.8,
              y: isTop ? 2.5 : 5.1,
              w: 1.6,
              h: 0.9,
              fontSize: 13,
              color: textHex,
              align: "center",
            });
          });
          break;

        case "quote":
          slide.addShape(prs.ShapeType.roundRect, {
            x: 1.0,
            y: 1.2,
            w: 8.0,
            h: 4.8,
            fill: { color: surfaceHex },
            line: { color: accentHex, width: 1 },
            rectRadius: 0.15,
          });
          slide.addText(`“`, {
            x: 1.5,
            y: 1.4,
            w: 1.0,
            h: 0.8,
            fontSize: 60,
            bold: true,
            color: accentHex,
            fontFace: theme.titleFont,
          });
          slide.addText(`"${s.quote || ""}"`, {
            x: 1.5,
            y: 2.2,
            w: 7.0,
            h: 2.2,
            fontSize: 30,
            italic: true,
            bold: true,
            color: textHex,
            fontFace: theme.titleFont,
            align: "center",
          });
          if (s.attribution) {
            slide.addText(`— ${s.attribution}`, {
              x: 1.5,
              y: 4.6,
              w: 7.0,
              h: 0.6,
              fontSize: 18,
              color: mutedHex,
              fontFace: theme.font,
              align: "right",
            });
          }
          break;

        case "checklist":
          slide.addText(s.title || "", {
            x: 0.8,
            y: 0.5,
            w: 8.4,
            h: 0.8,
            fontSize: 28,
            bold: true,
            color: textHex,
            fontFace: theme.titleFont,
          });
          (s.items || []).forEach((item: any, iIdx: number) => {
            slide.addShape(prs.ShapeType.roundRect, {
              x: 0.8,
              y: 1.6 + iIdx * 0.85,
              w: 8.4,
              h: 0.7,
              fill: { color: surfaceHex },
              rectRadius: 0.08,
            });
            slide.addText(item.checked ? "✓" : "○", {
              x: 1.1,
              y: 1.65 + iIdx * 0.85,
              w: 0.5,
              h: 0.5,
              fontSize: 20,
              color: item.checked ? secondaryHex : mutedHex,
              bold: true,
            });
            slide.addText(item.text || "", {
              x: 1.7,
              y: 1.65 + iIdx * 0.85,
              w: 7.2,
              h: 0.6,
              fontSize: 16,
              color: textHex,
              fontFace: theme.font,
            });
          });
          break;

        case "content-with-icon":
          slide.addShape(prs.ShapeType.roundRect, {
            x: 0.8,
            y: 1.2,
            w: 8.4,
            h: 4.8,
            fill: { color: surfaceHex },
            line: { color: accentHex, width: 1 },
            rectRadius: 0.15,
          });
          slide.addShape(prs.ShapeType.ellipse, {
            x: 1.3,
            y: 2.2,
            w: 1.8,
            h: 1.8,
            fill: { color: accentHex },
          });
          slide.addText(s.icon || "★", {
            x: 1.3,
            y: 2.35,
            w: 1.8,
            h: 1.5,
            fontSize: 40,
            color: bgHex,
            align: "center",
          });
          slide.addText(s.title || "", {
            x: 3.5,
            y: 1.8,
            w: 5.2,
            h: 0.8,
            fontSize: 28,
            bold: true,
            color: accentHex,
            fontFace: theme.titleFont,
          });
          slide.addText(s.content || "", {
            x: 3.5,
            y: 2.8,
            w: 5.2,
            h: 2.8,
            fontSize: 16,
            color: textHex,
            fontFace: theme.font,
          });
          break;

        case "call-to-action":
          slide.addShape(prs.ShapeType.roundRect, {
            x: 1.2,
            y: 1.2,
            w: 7.6,
            h: 4.8,
            fill: { color: surfaceHex },
            line: { color: accentHex, width: 1 },
            rectRadius: 0.15,
          });
          slide.addText(s.heading || s.title || "", {
            x: 1.5,
            y: 1.8,
            w: 7.0,
            h: 1.0,
            fontSize: 36,
            bold: true,
            color: accentHex,
            fontFace: theme.titleFont,
            align: "center",
          });
          slide.addText(s.description || "", {
            x: 1.5,
            y: 3.0,
            w: 7.0,
            h: 1.0,
            fontSize: 18,
            color: textHex,
            fontFace: theme.font,
            align: "center",
          });
          slide.addShape(prs.ShapeType.roundRect, {
            x: 3.8,
            y: 4.4,
            w: 2.4,
            h: 0.7,
            fill: { color: accentHex },
            rectRadius: 0.15,
          });
          slide.addText(s.cta || "Get Started", {
            x: 3.8,
            y: 4.5,
            w: 2.4,
            h: 0.5,
            fontSize: 18,
            bold: true,
            color: bgHex,
            fontFace: theme.font,
            align: "center",
          });
          break;

        default:
          slide.addText(s.title || s.heading || String(s.type), {
            x: 0.8,
            y: 2.5,
            w: 8.4,
            h: 1.5,
            fontSize: 28,
            color: accentHex,
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
