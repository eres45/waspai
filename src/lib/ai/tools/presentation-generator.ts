import { z } from "zod";
import { tool as createTool } from "ai";

const SlideSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("cover"),
    title: z.string().describe("Main Title (44pt bold)"),
    subtitle: z.string().describe("Compelling subtitle (24pt)"),
    tagline: z.string().describe("Key message at bottom (14pt)"),
  }),
  z.object({
    type: z.literal("bullet-list"),
    title: z.string().describe("Section Header (28pt)"),
    points: z.array(z.string()).describe("Max 4 points, 10-15 words each"),
  }),
  z.object({
    type: z.literal("two-column"),
    title: z.string().describe("Comparison Title"),
    left: z.object({
      heading: z.string().describe("Left Column Heading"),
      points: z.array(z.string()).describe("Max 3 points"),
    }),
    right: z.object({
      heading: z.string().describe("Right Column Heading"),
      points: z.array(z.string()).describe("Max 3 points"),
    }),
  }),
  z.object({
    type: z.literal("big-stat"),
    title: z.string().describe("Stat Context Title"),
    stat: z.string().describe("Large number/stat (80pt)"),
    description: z.string().describe("Context for the stat (16pt)"),
  }),
  z.object({
    type: z.literal("content-with-icon"),
    title: z.string().describe("Feature/Point Title"),
    icon: z.string().describe("Emoji or Lucide icon name"),
    content: z.string().describe("Detailed explanation paragraph"),
  }),
  z.object({
    type: z.literal("three-column"),
    title: z.string().describe("Breakdown Title"),
    columns: z
      .array(
        z.object({
          heading: z.string(),
          points: z.array(z.string()),
        }),
      )
      .length(3),
  }),
  z.object({
    type: z.literal("timeline"),
    title: z.string().describe("Evolution/Process Title"),
    timeline: z
      .array(
        z.object({
          year: z.string(),
          event: z.string(),
        }),
      )
      .min(3)
      .max(5),
  }),
  z.object({
    type: z.literal("quote"),
    quote: z.string().describe("Powerful statement (36pt italic)"),
    attribution: z.string().describe("Author/Source"),
  }),
  z.object({
    type: z.literal("checklist"),
    title: z.string().describe("Checklist Header"),
    items: z
      .array(
        z.object({
          text: z.string(),
          checked: z.boolean(),
        }),
      )
      .min(3)
      .max(6),
  }),
  z.object({
    type: z.literal("call-to-action"),
    title: z.string().describe("Final Slide Context"),
    heading: z.string().describe("Main Call (36pt)"),
    cta: z.string().describe("Button Text"),
    description: z.string().describe("Final closing statement"),
  }),
]);

export const PRESENTATION_THEMES = [
  // Modern aesthetic themes from beautiful-html-templates & free-ppt-template
  "bento-modern",
  "acid-brutalist",
  "soft-editorial",
  "editorial-forest",
  "cobalt-grid",
  "black-gold",
  "block-frame",
  "sakura-chroma",
  "8-bit-orbit",
  "broadside",
  "emerald-editorial",
  "studio",
  "capsule",
  "vellum",
  "monochrome",
  "neo-grid-bold",
  "pink-script",
  "pin-and-paper",
  "warm-gradient",
  "minimal-corporate",
  "cyber-neon",
  // Legacy aliases for backwards-compatibility
  "tech",
  "business",
  "creative",
  "education",
  "nature",
  "medical",
  "energy",
  "elegant",
] as const;

export const presentationGeneratorTool = createTool({
  description:
    "Generate a professional 10-slide PowerPoint presentation with curated aesthetic themes from beautiful-html-templates and free-ppt-template.",
  inputSchema: z.object({
    title: z.string().describe("Overall presentation title"),
    description: z.string().describe("Brief tagline/summary"),
    topic: z.string().describe("Topic of the presentation"),
    theme: z
      .enum(PRESENTATION_THEMES)
      .describe(
        "Aesthetic theme from beautiful-html-templates & free-ppt-template: bento-modern, acid-brutalist, black-gold, soft-editorial, editorial-forest, cobalt-grid, block-frame, sakura-chroma, 8-bit-orbit, broadside, emerald-editorial, studio, capsule, vellum, monochrome, neo-grid-bold, pink-script, pin-and-paper, warm-gradient, minimal-corporate, cyber-neon",
      ),
    slides: z
      .array(SlideSchema)
      .length(10)
      .describe("Exactly 10 slides with varied layouts"),
  }),
  execute: async (args) => {
    // Simply return the data to the client for browser-side PPTX generation
    return {
      success: true,
      ...args,
      generatedAt: new Date().toISOString(),
      status: "ready_for_browser_generation",
    };
  },
});
