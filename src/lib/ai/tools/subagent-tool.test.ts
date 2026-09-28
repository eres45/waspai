import { describe, it, expect, vi } from "vitest";
import { subagentTool, delegateSubagentSchema } from "./subagent-tool";

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    generateText: vi.fn().mockResolvedValue({
      text: "Synthesized research findings on 2026 AI models: DeepSeek V3 and Hermes 3 lead performance.",
    }),
  };
});

describe("subagentTool (DeepSeek Harness tool-subagent)", () => {
  it("validates input schema properly", () => {
    const valid = delegateSubagentSchema.parse({
      description: "Research 2026 models",
      prompt:
        "Perform deep research on top 10 LLMs released in 2026 and compare them.",
      allowWebSearch: true,
    });
    expect(valid.description).toBe("Research 2026 models");
    expect(valid.allowWebSearch).toBe(true);
  });

  it("spawns in-process subagent and returns clean synthesized result", async () => {
    const input = {
      description: "Research 2026 models",
      prompt: "Find and compare 2026 LLM benchmarks.",
    };

    const res = (await (subagentTool as any).execute(input, {})) as any;

    expect(res.status).toBe("completed");
    expect(res.subagentId).toMatch(/^subagent-/);
    expect(res.result).toContain("DeepSeek V3 and Hermes 3");
  });
});
