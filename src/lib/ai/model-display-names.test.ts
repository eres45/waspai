import { describe, expect, it } from "vitest";
import {
  cleanModelDisplayName,
  createReverseModelMapping,
} from "./model-display-names";

describe("cleanModelDisplayName", () => {
  it("uses static mapping if available", () => {
    // Claude with correct versioned display names
    expect(cleanModelDisplayName("claude-sonnet-4.5-proxy")).toBe(
      "Claude Sonnet 4.5",
    );
    expect(cleanModelDisplayName("claude-sonnet")).toBe("Claude Sonnet 3.7");
    expect(cleanModelDisplayName("claude-3-sonnet")).toBe("Claude 3.5 Sonnet");
    // Worker-prefixed variants resolve directly to named versions
    expect(cleanModelDisplayName("chatai-claude-sonnet")).toBe(
      "Claude Sonnet 3.7",
    );
    expect(cleanModelDisplayName("randomai-claude-sonnet")).toBe(
      "Claude Sonnet 3.7",
    );
    expect(cleanModelDisplayName("chatbotai-claude-3-sonnet")).toBe(
      "Claude 3.5 Sonnet",
    );
    expect(cleanModelDisplayName("openai-gpt-oss-120b")).toBe("GPT-OSS 120B");
  });

  it("strips raw backend/worker prefixes dynamically", () => {
    expect(cleanModelDisplayName("chatai-gpt-4")).toBe("GPT 4");
    expect(cleanModelDisplayName("groqw-llama-3.1-8b")).toBe("Llama 3.1 8B");
    expect(cleanModelDisplayName("freecf-mistral-7b")).toBe("Mistral 7B");
    expect(cleanModelDisplayName("sarvamai/samraad-v1")).toBe("Samraad v1");
  });

  it("strips proxy from prefix and suffix dynamically", () => {
    // Suffix cases
    expect(cleanModelDisplayName("llama-3-proxy")).toBe("Llama 3");
    expect(cleanModelDisplayName("gpt-4o-Proxy")).toBe("GPT 4o");

    // Prefix cases
    expect(cleanModelDisplayName("proxy-claude-instant")).toBe(
      "Claude Instant",
    );
    expect(cleanModelDisplayName("Proxy-deepseek-chat")).toBe("DeepSeek Chat");
  });

  it("strips proxy when it is a standalone word or middle word", () => {
    expect(cleanModelDisplayName("proxy")).toBe("");
    expect(cleanModelDisplayName("claude-proxy-sonnet")).toBe("Claude Sonnet");
  });

  it("handles case-insensitive replacement", () => {
    expect(cleanModelDisplayName("pRoXy-gemini-1.5")).toBe("Gemini 1.5");
    expect(cleanModelDisplayName("gemini-1.5-pRoXy")).toBe("Gemini 1.5");
  });

  it("replaces hyphens with spaces and capitalizes words correctly", () => {
    expect(cleanModelDisplayName("llama-3.1-8b-instruct")).toBe(
      "Llama 3.1 8B Instruct",
    );
    expect(cleanModelDisplayName("gemma-2-2b-it")).toBe("Gemma 2 2B IT");
  });

  it("converts hyphenated version numbers to decimals", () => {
    expect(cleanModelDisplayName("claude-opus-4-1")).toBe("Claude Opus 4.1");
    expect(cleanModelDisplayName("claude-opus-4-5")).toBe("Claude Opus 4.5");
    expect(cleanModelDisplayName("claude-opus-4-6")).toBe("Claude Opus 4.6");
    expect(cleanModelDisplayName("claude-sonnet-4-6")).toBe(
      "Claude Sonnet 4.6",
    );
    expect(cleanModelDisplayName("gpt-5-5")).toBe("GPT 5.5");
    // Should NOT match parameter sizes ending in b/m
    expect(cleanModelDisplayName("llama-3-8b")).toBe("Llama 3 8B");
  });

  it("standardizes casing for common model acronyms", () => {
    expect(cleanModelDisplayName("z-ai/glm-4.5-air")).toBe("GLM 4.5 Air");
    expect(cleanModelDisplayName("liquid/lfm-2.5")).toBe("LFM 2.5");
    expect(cleanModelDisplayName("qwen-qwq-32b")).toBe("Qwen QwQ 32B");
    expect(cleanModelDisplayName("nvidia/nemotron-vl")).toBe("Nemotron VL");
    expect(cleanModelDisplayName("openai/gpt-oss-120b")).toBe("GPT-OSS 120B");
  });
});

describe("createReverseModelMapping", () => {
  it("prioritizes canonical/non-prefixed model IDs over prefixed ones", () => {
    const { models } = createReverseModelMapping();

    // Verify Claude 3.5 Sonnet maps to claude-3-sonnet instead of chatbotai-claude-3-sonnet
    expect(models["Claude 3.5 Sonnet"]).toBe("claude-3-sonnet");

    // Verify Claude Sonnet 3.7 maps to claude-sonnet instead of chatai-claude-sonnet / randomai-claude-sonnet
    expect(models["Claude Sonnet 3.7"]).toBe("claude-sonnet");
  });

  it("resolves dynamic and clashing model IDs correctly when provided", () => {
    const dynamicModelIds = [
      "claude-opus-4-7",
      "lordrouter-claude-opus-4-7",
      "lordrouter-liquid/lfm-2.5-1.2b-instruct:free",
    ];
    const { models } = createReverseModelMapping(dynamicModelIds);

    // Verify clash-resolved P2 model maps back to its lordrouter backend name
    expect(models["Claude Opus 4.7 P2"]).toBe("lordrouter-claude-opus-4-7");

    // Verify standard clashing model maps to its standard backend name
    expect(models["Claude Opus 4.7"]).toBe("claude-opus-4-7");

    // Verify dynamic model without P2 maps correctly
    expect(models["LFM 2.5 1.2B Instruct"]).toBe(
      "lordrouter-liquid/lfm-2.5-1.2b-instruct:free",
    );
  });
});
