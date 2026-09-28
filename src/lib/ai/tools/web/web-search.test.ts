import { describe, it, expect } from "vitest";
import { webSearchTool, freeSearchSchema } from "./web-search";

describe("Web Search Tool (DDGS & DeepSeek Architecture)", () => {
  it("validates search query parameters accurately", () => {
    const parsed = freeSearchSchema.parse({
      query: "Top 10 AI models 2026",
      numResults: 5,
    });
    expect(parsed.query).toBe("Top 10 AI models 2026");
    expect(parsed.numResults).toBe(5);
  });

  it("handles empty query gracefully", async () => {
    const result = await (webSearchTool as any).execute({ query: "" });
    expect(result.requestId).toBe("empty-query");
    expect(result.results).toEqual([]);
  });

  it("executes resilient web search using DDGS with real results", async () => {
    const result = await (webSearchTool as any).execute({
      query: "DeepSeek V3 LLM",
      numResults: 3,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.results.length).toBeGreaterThan(0);

    const first = result.results[0];
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("url");
    expect(first.url).toMatch(/^https?:\/\//);
    expect(result.guide).toContain("Synthesize these live search results");
  }, 15000);
});
