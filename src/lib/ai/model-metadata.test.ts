import { describe, expect, test } from "vitest";
import { getModelMetadata } from "./model-metadata";

describe("getModelMetadata", () => {
  test("resolves exact matches correctly", () => {
    const meta = getModelMetadata("claude-sonnet-4.5-proxy");
    expect(meta.contextLength).toBe("200K tokens");
    expect(meta.toolsSupported).toBe(true);
    expect(meta.inputCost).toBe("$3.000/1M");
    expect(meta.outputCost).toBe("$15.000/1M");
    expect(meta.description).toContain("Anthropic's latest flagship model");
  });

  test("resolves case-insensitive matches", () => {
    const meta = getModelMetadata("CLAUDE-SONNET");
    expect(meta.contextLength).toBe("200K tokens");
    expect(meta.inputCost).toBe("$3.000/1M");
  });

  test("applies isToolCallUnsupported override", () => {
    const metaWithTools = getModelMetadata(
      "claude-sonnet-4.5-proxy",
      "anthropic",
      false,
    );
    expect(metaWithTools.toolsSupported).toBe(true);

    const metaWithoutTools = getModelMetadata(
      "claude-sonnet-4.5-proxy",
      "anthropic",
      true,
    );
    expect(metaWithoutTools.toolsSupported).toBe(false);
  });

  test("falls back intelligently for unknown models by provider", () => {
    const googleMeta = getModelMetadata("unknown-gemini-model", "google");
    expect(googleMeta.contextLength).toBe("1M tokens");
    expect(googleMeta.inputCost).toBe("$0.075/1M");

    const anthropicMeta = getModelMetadata("unknown-claude-model", "anthropic");
    expect(anthropicMeta.contextLength).toBe("200K tokens");
    expect(anthropicMeta.inputCost).toBe("$3.00/1M");
  });

  test("falls back intelligently for unknown models by keyword matching", () => {
    const llamaMeta = getModelMetadata("meta-llama-123b");
    expect(llamaMeta.contextLength).toBe("128K tokens");
    expect(llamaMeta.inputCost).toBe("$0.60/1M");

    const deepseekMeta = getModelMetadata("deepseek-custom-v3");
    expect(deepseekMeta.contextLength).toBe("64K tokens");
    expect(deepseekMeta.inputCost).toBe("$0.14/1M");
  });

  test("uses a safe default when no match or keyword is found", () => {
    const defaultMeta = getModelMetadata(
      "totally-custom-model-id",
      "some-provider",
    );
    expect(defaultMeta.contextLength).toBe("128K tokens");
    expect(defaultMeta.toolsSupported).toBe(true);
    expect(defaultMeta.inputCost).toBe("$0.50/1M");
  });
});
