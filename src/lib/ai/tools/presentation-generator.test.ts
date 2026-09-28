import { describe, it, expect } from "vitest";
import {
  presentationGeneratorTool,
  presentationInputSchema,
  PRESENTATION_THEMES,
} from "./presentation-generator";
import {
  resolvePresentationTheme,
  PRESENTATION_THEMES as THEMES_MAP,
  stripHex,
} from "./presentation-themes";

describe("Presentation Generator Tool", () => {
  const sample10Slides = [
    {
      type: "cover",
      title: "Wasp AI Launch",
      subtitle: "Automated Agent Ecosystem",
      tagline: "Build without limits",
    },
    {
      type: "bullet-list",
      title: "Introduction",
      points: [
        "Wasp AI is highly agentic.",
        "Integrates seamlessly with tools.",
        "Fast deployment and execution.",
        "Free model catalogs included.",
      ],
    },
    {
      type: "big-stat",
      title: "Adoption Rate",
      stat: "99.9%",
      description: "Customer satisfaction and tool invocation rate",
    },
    {
      type: "two-column",
      title: "Comparison",
      left: {
        heading: "Legacy bots",
        points: ["Slow", "Expensive", "Fragile"],
      },
      right: {
        heading: "Wasp AI",
        points: ["Realtime", "Free", "Robust"],
      },
    },
    {
      type: "content-with-icon",
      title: "Security first",
      icon: "ShieldCheck",
      content: "Security-first sandboxed browser and executor tools.",
    },
    {
      type: "three-column",
      title: "Architecture",
      columns: [
        { heading: "Backend", points: ["Cloudflare Workers", "Drizzle"] },
        { heading: "Frontend", points: ["Next.js App router", "Tailwind"] },
        { heading: "Storage", points: ["Supabase", "Telegram"] },
      ],
    },
    {
      type: "timeline",
      title: "Roadmap",
      timeline: [
        { year: "2024", event: "Initial Beta Release" },
        { year: "2025", event: "Dynamic NIM support" },
        { year: "2026", event: "Llama 4 Scout Vision Integration" },
      ],
    },
    {
      type: "quote",
      quote: "Agentic AI will reshape the entire software landscape.",
      attribution: "Google DeepMind team",
    },
    {
      type: "checklist",
      title: "Next Steps",
      items: [
        { text: "Try selected models", checked: true },
        { text: "Upload document and images", checked: true },
        { text: "Enjoy automatic visual context", checked: false },
      ],
    },
    {
      type: "call-to-action",
      title: "Conclusion",
      heading: "Join Wasp AI Ecosystem Today",
      cta: "Get Started Now",
      description:
        "Completely open-source, completely free, completely agentic.",
    },
  ];

  it("successfully processes presentation with modern bento-modern theme", async () => {
    const result = await (presentationGeneratorTool.execute as any)({
      title: "Wasp AI Launch",
      description: "Next-gen AI assistant ecosystem",
      topic: "Artificial Intelligence",
      theme: "bento-modern",
      slides: sample10Slides,
    });

    expect(result.success).toBe(true);
    expect(result.title).toBe("Wasp AI Launch");
    expect(result.theme).toBe("bento-modern");
    expect(result.slides.length).toBe(10);
    expect(result.status).toBe("ready_for_browser_generation");
  });

  it("successfully processes presentation with acid-brutalist theme", async () => {
    const result = await (presentationGeneratorTool.execute as any)({
      title: "AI Startup Deck",
      description: "Acid brutalist investor deck",
      topic: "Autonomous Startups",
      theme: "acid-brutalist",
      slides: sample10Slides,
    });

    expect(result.success).toBe(true);
    expect(result.theme).toBe("acid-brutalist");
  });

  it("successfully processes presentation with soft-editorial theme", async () => {
    const result = await (presentationGeneratorTool.execute as any)({
      title: "Literary Quarterly Review",
      description: "Warm paper and Cormorant Garamond typography",
      topic: "Design & Literature",
      theme: "soft-editorial",
      slides: sample10Slides,
    });

    expect(result.success).toBe(true);
    expect(result.theme).toBe("soft-editorial");
  });

  it("resolves modern and legacy themes correctly", () => {
    // Direct modern themes
    expect(resolvePresentationTheme("bento-modern").name).toBe("Bento Modern");
    expect(resolvePresentationTheme("soft-editorial").source).toBe(
      "beautiful-html-templates",
    );
    expect(resolvePresentationTheme("acid-brutalist").source).toBe(
      "free-ppt-template",
    );
    expect(resolvePresentationTheme("cobalt-grid").accent).toBe("#0020FF");

    // Legacy fallbacks
    expect(resolvePresentationTheme("tech").id).toBe("bento-modern");
    expect(resolvePresentationTheme("business").id).toBe("minimal-corporate");
    expect(resolvePresentationTheme("creative").id).toBe("block-frame");
    expect(resolvePresentationTheme("education").id).toBe("soft-editorial");
    expect(resolvePresentationTheme("nature").id).toBe("editorial-forest");
    expect(resolvePresentationTheme("medical").id).toBe("cobalt-grid");
    expect(resolvePresentationTheme("energy").id).toBe("acid-brutalist");
    expect(resolvePresentationTheme("elegant").id).toBe("black-gold");

    // Unknown fallback defaults to bento-modern
    expect(resolvePresentationTheme("non-existent-theme").id).toBe(
      "bento-modern",
    );
  });

  it("strips hex hash signs correctly for pptxgenjs", () => {
    expect(stripHex("#0F0F1A")).toBe("0F0F1A");
    expect(stripHex("FFFFFF")).toBe("FFFFFF");
    expect(stripHex("#00D4FF")).toBe("00D4FF");
  });

  it("contains all curated themes from both repositories in registry", () => {
    // beautiful-html-templates
    expect(THEMES_MAP).toHaveProperty("soft-editorial");
    expect(THEMES_MAP).toHaveProperty("editorial-forest");
    expect(THEMES_MAP).toHaveProperty("cobalt-grid");
    expect(THEMES_MAP).toHaveProperty("sakura-chroma");
    expect(THEMES_MAP).toHaveProperty("block-frame");
    expect(THEMES_MAP).toHaveProperty("8-bit-orbit");
    expect(THEMES_MAP).toHaveProperty("broadside");
    expect(THEMES_MAP).toHaveProperty("pin-and-paper");
    expect(THEMES_MAP).toHaveProperty("emerald-editorial");
    expect(THEMES_MAP).toHaveProperty("studio");
    expect(THEMES_MAP).toHaveProperty("capsule");
    expect(THEMES_MAP).toHaveProperty("vellum");
    expect(THEMES_MAP).toHaveProperty("monochrome");
    expect(THEMES_MAP).toHaveProperty("neo-grid-bold");
    expect(THEMES_MAP).toHaveProperty("pink-script");

    // free-ppt-template
    expect(THEMES_MAP).toHaveProperty("bento-modern");
    expect(THEMES_MAP).toHaveProperty("acid-brutalist");
    expect(THEMES_MAP).toHaveProperty("black-gold");
    expect(THEMES_MAP).toHaveProperty("warm-gradient");
    expect(THEMES_MAP).toHaveProperty("minimal-corporate");
    expect(THEMES_MAP).toHaveProperty("cyber-neon");

    expect(PRESENTATION_THEMES.length).toBeGreaterThan(20);
  });

  it("resiliently accepts 5 slides without throwing length validation errors", async () => {
    const rawInput = {
      title: "AI Models 2026",
      description: "Quick 5-slide overview",
      topic: "AI",
      theme: "bento-modern",
      slides: sample10Slides.slice(0, 5),
    };

    const parsed = (presentationInputSchema as any).parse(rawInput);
    expect(parsed.slides.length).toBe(5);

    const result = await (presentationGeneratorTool.execute as any)(parsed);
    expect(result.success).toBe(true);
    expect(result.slides.length).toBe(5);
  });

  it("resiliently accepts 'sections' instead of 'slides' and normalizes layout aliases", async () => {
    const rawInput = {
      title: "Model Architecture",
      description: "Document converted to slides",
      topic: "Transformers",
      theme: "cobalt-grid",
      sections: [
        {
          layout: "cover",
          title: "Transformers in 2026",
          subtitle: "State of Deep Learning",
        },
        {
          layout: "two-column",
          title: "Dense vs MoE",
          content: "Dense models are predictable\nMoE models scale better",
        },
        {
          layout: "big-stat",
          title: "Parameter Efficiency",
          stat: "120B",
          description: "Active parameter count",
        },
      ],
    };

    const parsed = (presentationInputSchema as any).parse(rawInput);
    expect(parsed.slides.length).toBe(3);
    expect(parsed.slides[0].type).toBe("cover");
    expect(parsed.slides[1].type).toBe("two-column");
    expect(parsed.slides[1].left.heading).toBeDefined();
    expect(parsed.slides[2].type).toBe("big-stat");
    expect(parsed.slides[2].stat).toBe("120B");

    const result = await (presentationGeneratorTool.execute as any)(parsed);
    expect(result.success).toBe(true);
    expect(result.slides.length).toBe(3);
  });

  it("handles unknown theme and missing fields gracefully with defaults", async () => {
    const rawInput = {
      title: "Minimal Test",
      description: "Testing fallbacks",
      topic: "Testing",
      theme: "non-existent-theme-xyz",
      slides: [
        {
          title: "Incomplete Slide",
          content: "Just a paragraph without points array or type",
        },
      ],
    };

    const parsed = (presentationInputSchema as any).parse(rawInput);
    expect(parsed.theme).toBe("bento-modern");
    expect(parsed.slides.length).toBe(1);
    expect(parsed.slides[0].type).toBe("bullet-list");
    expect(parsed.slides[0].points.length).toBeGreaterThan(0);
  });
});
