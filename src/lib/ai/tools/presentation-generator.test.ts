import { describe, it, expect } from "vitest";
import { presentationGeneratorTool } from "./presentation-generator";

describe("Presentation Generator Tool", () => {
  it("successfully validates and processes a 10-slide structure", async () => {
    const result = await presentationGeneratorTool.execute({
      title: "Wasp AI Launch",
      description: "Next-gen AI assistant ecosystem",
      topic: "Artificial Intelligence",
      theme: "tech",
      slides: [
        {
          type: "cover",
          title: "Wasp AI",
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
      ],
    });

    expect(result.success).toBe(true);
    expect(result.title).toBe("Wasp AI Launch");
    expect(result.theme).toBe("tech");
    expect(result.slides.length).toBe(10);
    expect(result.status).toBe("ready_for_browser_generation");
  });
});
