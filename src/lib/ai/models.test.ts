import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  OPENAI_FILE_MIME_TYPES,
  ANTHROPIC_FILE_MIME_TYPES,
} from "./file-support";
import { cleanModelDisplayName } from "./model-display-names";

vi.mock("server-only", () => ({}));

// Mock the fetch endpoint for worker models
global.fetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes("/v1/models")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            { id: "GPT-4o (P1)", owned_by: "chatai" },
            { id: "Claude 3.5 Sonnet (P1)", owned_by: "chatai" },
          ],
        }),
    } as any);
  }
  return Promise.reject(new Error("Unknown URL"));
});

let modelsModule: typeof import("./models");

beforeAll(async () => {
  modelsModule = await import("./models");
});

describe("customModelProvider file support metadata", () => {
  it("includes default file support for OpenAI GPT-4o (P1)", async () => {
    const {
      customModelProvider,
      getFilePartSupportedMimeTypes,
      buildDynamicModelsInfo,
    } = modelsModule;
    const model = customModelProvider.getModel({
      provider: "OpenAI",
      model: "GPT-4o (P1)",
    });
    expect(getFilePartSupportedMimeTypes(model)).toEqual(
      Array.from(OPENAI_FILE_MIME_TYPES),
    );

    const modelsInfo = await buildDynamicModelsInfo();
    const openaiProvider = modelsInfo.find(
      (item) => item.provider === "OpenAI",
    );
    const metadata = openaiProvider?.models.find(
      (item) => item.name === "GPT-4o (P1)",
    );

    expect(metadata?.supportedFileMimeTypes).toEqual(
      Array.from(OPENAI_FILE_MIME_TYPES),
    );
  });

  it("adds rich support for Anthropic Claude 3.5 Sonnet (P1)", () => {
    const { customModelProvider, getFilePartSupportedMimeTypes } = modelsModule;
    const model = customModelProvider.getModel({
      provider: "OpenAI", // Keep OpenAI provider but test Claude model
      model: "Claude 3.5 Sonnet (P1)",
    });
    expect(getFilePartSupportedMimeTypes(model)).toEqual(
      Array.from(ANTHROPIC_FILE_MIME_TYPES),
    );
  });

  it("deduplicates models in buildDynamicModelsInfo by display name, prioritizing canonical over prefixed", async () => {
    const { buildDynamicModelsInfo } = modelsModule;

    // Temporarily mock fetch to return duplicates
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/v1/models")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                { id: "claude-3-sonnet", owned_by: "anthropic" },
                { id: "chatbotai-claude-3-sonnet", owned_by: "anthropic" },
                { id: "chatai-claude-sonnet", owned_by: "anthropic" },
                { id: "claude-sonnet", owned_by: "anthropic" },
              ],
            }),
        } as any);
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    try {
      const modelsInfo = await buildDynamicModelsInfo();
      const anthropicProvider = modelsInfo.find(
        (item) => item.provider === "Anthropic",
      );

      expect(anthropicProvider).toBeDefined();

      // Should deduplicate "Claude 3.5 Sonnet" and "Claude Sonnet 3.7"
      // Result should have exactly 2 models instead of 4
      expect(anthropicProvider?.models.length).toBe(2);

      // Verify that it selected the canonical model IDs (non-prefixed, shortest)
      const sonnet35 = anthropicProvider?.models.find(
        (m) => cleanModelDisplayName(m.name) === "Claude 3.5 Sonnet",
      );
      const sonnet37 = anthropicProvider?.models.find(
        (m) => cleanModelDisplayName(m.name) === "Claude Sonnet 3.7",
      );

      expect(sonnet35?.name).toBe("claude-3-sonnet");
      expect(sonnet37?.name).toBe("claude-sonnet");
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe("WaspAI & LordRouter integrations", () => {
  it("cleans WaspAI display name correctly", () => {
    expect(cleanModelDisplayName("waspai-model")).toBe("WaspAI model");
  });

  it("supports tool calling for waspai-model", () => {
    const { isToolCallUnsupportedModel } = modelsModule;
    expect(isToolCallUnsupportedModel("waspai-model")).toBe(false);
  });

  it("cleans LordRouter display names and handles clashes with P2", () => {
    // claude-opus-4-7 exists in MODEL_DISPLAY_NAMES, so lordrouter-claude-opus-4-7 should have P2
    expect(cleanModelDisplayName("lordrouter-claude-opus-4-7")).toBe(
      "Claude Opus 4.7 P2",
    );

    // stepfun-ai/step-3.5-flash does not exist statically in MODEL_DISPLAY_NAMES, so it cleans dynamically
    expect(cleanModelDisplayName("lordrouter-stepfun-ai/step-3.5-flash")).toBe(
      "Step 3.5 Flash",
    );

    // @cf/moonshotai/kimi-k2.6 should be cleaned to "Kimi K2.6" without any prefix
    expect(cleanModelDisplayName("lordrouter-@cf/moonshotai/kimi-k2.6")).toBe(
      "Kimi K2.6",
    );
  });

  it("supports tool calling for LordRouter models", () => {
    const { isToolCallUnsupportedModel } = modelsModule;
    expect(isToolCallUnsupportedModel("lordrouter-claude-opus-4-7")).toBe(
      false,
    );
  });

  it("correctly resolves model tier (Free vs Pro) for LordRouter models", () => {
    const { getModelTier } = modelsModule;
    expect(getModelTier("lordrouter-gpt-5")).toBe("Pro");
    expect(getModelTier("lordrouter-deepseek-r1")).toBe("Pro");
    expect(getModelTier("lordrouter-gemini-2.5-flash")).toBe("Pro"); // removed: API key not found upstream
    expect(getModelTier("lordrouter-gemini-2.5-pro")).toBe("Free"); // working model
    expect(getModelTier("lordrouter-nvidia/nemotron-nano-9b-v2:free")).toBe(
      "Free",
    );

    const proModels = [
      "gemini-3-pro",
      "gemini-3.1-flash-lite",
      "gemini-3.1-pro",
      "gemini-3.5-flash",
      "gemini-3.5-flash-thinking",
      "gemini-3.5-flash-thinking-lite",
      "claude-opus-4-1",
      "claude-opus-4-5",
      "claude-opus-4-6",
      "claude-opus-4-7",
      "claude-sonnet-4-6",
      "gpt-5-5",
      "gpt-5-mini",
      "gpt-5.1",
      "gpt-5.3",
      "gpt-5.3-chat-latest",
      "gpt-5.4",
      "gpt-5.5",
      "deepseek-v4-flash",
      "deepseek-v4-pro",
    ];

    for (const m of proModels) {
      expect(getModelTier(`lordrouter-${m}`)).toBe("Pro");
    }
  });
});
