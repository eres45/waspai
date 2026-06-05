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
});

describe("createReverseModelMapping", () => {
  it("prioritizes canonical/non-prefixed model IDs over prefixed ones", () => {
    const { models } = createReverseModelMapping();

    // Verify Claude 3.5 Sonnet maps to claude-3-sonnet instead of chatbotai-claude-3-sonnet
    expect(models["Claude 3.5 Sonnet"]).toBe("claude-3-sonnet");

    // Verify Claude Sonnet 3.7 maps to claude-sonnet instead of chatai-claude-sonnet / randomai-claude-sonnet
    expect(models["Claude Sonnet 3.7"]).toBe("claude-sonnet");
  });
});
