import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  OPENAI_FILE_MIME_TYPES,
  ANTHROPIC_FILE_MIME_TYPES,
} from "./file-support";
import { cleanModelDisplayName } from "./model-display-names";

vi.mock("server-only", () => ({}));
vi.mock("playwright", () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

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
}, 30000);

describe("customModelProvider file support metadata", () => {
  it("includes default file support for OpenAI GPT-4o (P1)", () => {
    const { customModelProvider, getFilePartSupportedMimeTypes } = modelsModule;
    const model = customModelProvider.getModel({
      provider: "OpenAI",
      model: "GPT-4o (P1)",
    });
    expect(getFilePartSupportedMimeTypes(model)).toEqual(
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

  it("returns default gpt-oss-120b, TokenHarbor, Mistral, and BudsAI free models in buildDynamicModelsInfo", async () => {
    const {
      buildDynamicModelsInfo,
      isToolCallUnsupportedModel,
      getModelTier,
      customModelProvider,
    } = modelsModule;
    const modelsInfo = await buildDynamicModelsInfo();

    const providers = modelsInfo.map((p) => p.provider);
    expect(providers).toEqual([
      "OpenAI",
      "Anthropic",
      "Google",
      "DeepSeek",
      "Qwen",
      "Xiaomi",
      "Mistral",
      "StepFun",
      "Z-AI",
    ]);

    const allModels = modelsInfo.flatMap((p) => p.models);
    const modelNames = allModels.map((m) => m.name);
    expect(modelNames).toContain("gpt-5.6-luna");
    expect(modelNames).toContain("gpt-5.4-mini");
    expect(modelNames).toContain("claude-haiku-4.5");
    expect(modelNames).toContain("mistral-small-4");
    expect(modelNames).toContain("gemma-4-31b");
    expect(modelNames).toContain("gpt-oss-120b");
    expect(modelNames).toContain("deepseek-v4.1-flash:free");
    expect(modelNames).toContain("deepseek-v4-flash:free");
    expect(modelNames).toContain("qwen3.8-flash:free");
    expect(modelNames).toContain("mimo-v2.6-flash:free");
    expect(modelNames).toContain("mimo-v2.5:free");
    expect(modelNames).toContain("mistral-code-latest");
    expect(modelNames).toContain("ministral-14b-latest");
    expect(modelNames).toContain("codestral-latest");
    expect(modelNames).toContain("ox-alpha");
    expect(modelNames).toContain("step-3.7-flash");
    expect(modelNames).toContain("glm-5.3-flash");

    // Tier checks (Ultra for DuckAI models, Free for worker catalog)
    const ultraSet = new Set([
      "gpt-5.6-luna",
      "gpt-5.4-mini",
      "claude-haiku-4.5",
      "mistral-small-4",
      "gemma-4-31b",
    ]);
    for (const m of allModels) {
      if (ultraSet.has(m.name)) {
        expect(m.tier).toBe("Ultra");
        expect(getModelTier(m.name)).toBe("Ultra");
      } else {
        expect(m.tier).toBe("Free");
        expect(getModelTier(m.name)).toBe("Free");
      }
    }

    // Tool call support: all registered models support tool calls via smart provider
    for (const m of allModels) {
      expect(isToolCallUnsupportedModel(m.name)).toBe(false);
    }

    // Mistral model instantiation & alias resolution
    expect(
      customModelProvider.getModel({
        provider: "Mistral",
        model: "ministral-14b",
      }),
    ).toBeDefined();
    expect(
      customModelProvider.getModel({
        provider: "Mistral",
        model: "mistral-code-latest",
      }),
    ).toBeDefined();

    // StepFun and Z-AI public creator lab instantiation
    expect(
      customModelProvider.getModel({
        provider: "StepFun",
        model: "step-3.7-flash",
      }),
    ).toBeDefined();
    expect(
      customModelProvider.getModel({
        provider: "Z-AI",
        model: "glm-5.3-flash",
      }),
    ).toBeDefined();
    expect(
      customModelProvider.getModel({
        provider: "Z-AI",
        model: "ox-alpha",
      }),
    ).toBeDefined();

    // BudsAI & SeekAI backend fallback instantiation
    expect(
      customModelProvider.getModel({
        provider: "BudsAI",
        model: "ox-alpha",
      }),
    ).toBeDefined();
    expect(
      customModelProvider.getModel({
        provider: "BudsAI",
        model: "step-3.7-flash",
      }),
    ).toBeDefined();

    // SeekAI model instantiation
    expect(
      customModelProvider.getModel({
        provider: "SeekAI",
        model: "deepseek-ai/DeepSeek-V4-Flash-0731",
      }),
    ).toBeDefined();
    expect(
      customModelProvider.getModel({
        provider: "SeekAI",
        model: "glm-5.3-flash",
      }),
    ).toBeDefined();
  });
});

describe("WaspAI & LordRouter integrations", () => {
  it("cleans WaspAI display name correctly", () => {
    expect(cleanModelDisplayName("waspai-model")).toBe("Wasp VoidFlash");
  });

  it("supports tool calling for waspai-model, Sarvam, and GPT-OSS models", () => {
    const { isToolCallUnsupportedModel } = modelsModule;
    expect(isToolCallUnsupportedModel("waspai-model")).toBe(false);
    expect(isToolCallUnsupportedModel("sarvam-30b")).toBe(false);
    expect(isToolCallUnsupportedModel("sarvam-105b")).toBe(false);
    expect(isToolCallUnsupportedModel("sarvam-m")).toBe(false);
    expect(isToolCallUnsupportedModel("gpt-oss-120b")).toBe(false);
    expect(isToolCallUnsupportedModel("gpt-oss-20b")).toBe(false);
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
    expect(getModelTier("lordrouter-gemini-2.5-pro")).toBe("Pro");
    expect(getModelTier("lordrouter-nvidia/nemotron-nano-9b-v2:free")).toBe(
      "Pro",
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

describe("getModelProvider", () => {
  it("resolves Google Gemini models correctly when owned by gemini-openai", () => {
    const { getModelProvider } = modelsModule;
    expect(getModelProvider("gemini-2.5-flash", "gemini-openai")).toBe(
      "Google",
    );
    expect(getModelProvider("gemini-2.5-flash-lite", "gemini-openai")).toBe(
      "Google",
    );
  });

  it("resolves standard OpenAI and Anthropic models correctly", () => {
    const { getModelProvider } = modelsModule;
    expect(getModelProvider("gpt-4o", "openai")).toBe("OpenAI");
    expect(getModelProvider("claude-3-5-sonnet", "anthropic")).toBe(
      "Anthropic",
    );
    expect(getModelProvider("frenix-llama-3.1-70b")).toBe("Meta");
  });
});

describe("sanitizeMessageToolCalls", () => {
  it("sanitizes null args and missing inputs in message parts to empty objects", () => {
    const { sanitizeMessageToolCalls } = modelsModule;
    const messages = [
      {
        role: "assistant",
        parts: [
          {
            type: "tool-call",
            toolCallId: "call-1",
            toolName: "getWeather",
            args: null,
          },
        ],
      },
    ];

    const result = sanitizeMessageToolCalls(messages as any);
    expect(result[0].parts[0].args).toEqual({});
    expect(result[0].parts[0].input).toEqual({});
  });

  it("sanitizes invalid JSON strings in message parts to empty objects", () => {
    const { sanitizeMessageToolCalls } = modelsModule;
    const messages = [
      {
        role: "assistant",
        parts: [
          {
            type: "tool-call",
            toolCallId: "call-2",
            toolName: "getWeather",
            args: "invalid-json",
          },
        ],
      },
    ];

    const result = sanitizeMessageToolCalls(messages as any);
    expect(result[0].parts[0].args).toEqual({});
    expect(result[0].parts[0].input).toEqual({});
  });

  it("parses valid JSON strings in message parts to objects", () => {
    const { sanitizeMessageToolCalls } = modelsModule;
    const messages = [
      {
        role: "assistant",
        parts: [
          {
            type: "tool-call",
            toolCallId: "call-3",
            toolName: "getWeather",
            args: '{"city":"Berlin"}',
          },
        ],
      },
    ];

    const result = sanitizeMessageToolCalls(messages as any);
    expect(result[0].parts[0].args).toEqual({ city: "Berlin" });
    expect(result[0].parts[0].input).toEqual({ city: "Berlin" });
  });

  it("sanitizes client-side toolInvocations correctly", () => {
    const { sanitizeMessageToolCalls } = modelsModule;
    const messages = [
      {
        role: "assistant",
        toolInvocations: [
          {
            state: "result",
            toolCallId: "call-4",
            toolName: "getWeather",
            args: null,
            result: "done",
          },
        ],
      },
    ];

    const result = sanitizeMessageToolCalls(messages);
    expect(result[0].toolInvocations[0].args).toEqual({});
  });

  it("sets deepseek-v4.1-flash:free as default and configures Ultra tier models correctly", async () => {
    const {
      buildDynamicModelsInfo,
      customModelProvider,
      isToolCallUnsupportedModel,
      getModelTier,
      DEFAULT_CHAT_MODEL,
      ULTRA_TIER_MODELS,
    } = modelsModule;

    expect(DEFAULT_CHAT_MODEL).toEqual({
      provider: "DeepSeek",
      model: "deepseek-v4.1-flash:free",
    });

    const modelsInfo = await buildDynamicModelsInfo();
    expect(modelsInfo.length).toBe(9);
    expect(modelsInfo[0].provider).toBe("OpenAI");
    expect(modelsInfo[0].models[0].name).toBe("gpt-5.6-luna");

    // Ultra tier checks for all 5 DuckAI frontier models
    const duckAIUltraModels = [
      "claude-haiku-4.5",
      "mistral-small-4",
      "gpt-5.4-mini",
      "gpt-5.6-luna",
      "gemma-4-31b",
    ];

    for (const m of duckAIUltraModels) {
      expect(getModelTier(m)).toBe("Ultra");
      expect(ULTRA_TIER_MODELS.has(m)).toBe(true);
    }

    // Free tier checks
    expect(getModelTier("gpt-oss-120b")).toBe("Free");

    // Tool calling supported checks
    expect(isToolCallUnsupportedModel("gpt-oss-120b")).toBe(false);
    expect(isToolCallUnsupportedModel("claude-haiku-4.5")).toBe(false);

    // Model instantiation
    const model = customModelProvider.getModel({
      provider: "OpenAI",
      model: "gpt-oss-120b",
    });
    expect(model).toBeDefined();

    const haikuModel = customModelProvider.getModel({
      provider: "Anthropic",
      model: "claude-haiku-4.5",
    });
    expect(haikuModel).toBeDefined();
  });

  describe("stitchContinuation (Auto-Continuation on Token Limits)", () => {
    it("stitches partial code block without redundant duplicate fences", () => {
      const { stitchContinuation } = modelsModule;
      const prev =
        "```python\nclass Food:\n    def respawn(self, occupied):\n        free_cells = ";
      const cont =
        "```python\n        free_cells = [(x, y) for x in range(self.width)]\n        return free_cells\n```";
      const result = stitchContinuation(prev, cont);

      expect(result).toBe(
        "```python\nclass Food:\n    def respawn(self, occupied):\n        free_cells = [(x, y) for x in range(self.width)]\n        return free_cells\n```",
      );
    });

    it("handles continuation without unclosed code block", () => {
      const { stitchContinuation } = modelsModule;
      const prev = "Here is the summary of the main points:\n1. First item";
      const cont = "\n2. Second item\n3. Third item";
      const result = stitchContinuation(prev, cont);

      expect(result).toBe(
        "Here is the summary of the main points:\n1. First item\n2. Second item\n3. Third item",
      );
    });

    it("deduplicates repeated identical last lines", () => {
      const { stitchContinuation } = modelsModule;
      const prev = "def calculate_total(items):\n    total_sum = 0";
      const cont =
        "    total_sum = 0\n    for item in items:\n        total_sum += item";
      const result = stitchContinuation(prev, cont);

      expect(result).toBe(
        "def calculate_total(items):\n    total_sum = 0\n    for item in items:\n        total_sum += item",
      );
    });
  });

  describe("Multi-Provider Fallback & Deduplication", () => {
    it("returns alternative providers for DeepSeek V4 Flash in priority order", () => {
      const { getModelProviderFallbacks } = modelsModule;
      const fallbacks = getModelProviderFallbacks(
        "deepseek-v4-flash",
        "DeepSeek",
      );

      // DeepSeek is filtered out since it's current provider
      expect(fallbacks).toEqual([
        { provider: "BudsAI", model: "deepseek-v4-flash" },
        { provider: "SeekAI", model: "deepseek-ai/DeepSeek-V4-Flash-0731" },
        { provider: "Multimodal", model: "deepseek-v4-flash" },
      ]);
    });

    it("returns alternative providers for DeepSeek V4 Flash:free when called without provider", () => {
      const { getModelProviderFallbacks } = modelsModule;
      const fallbacks = getModelProviderFallbacks("deepseek-v4-flash:free");

      expect(fallbacks.some((f) => f.provider === "BudsAI")).toBe(true);
      expect(fallbacks.some((f) => f.provider === "SeekAI")).toBe(true);
      expect(fallbacks.some((f) => f.provider === "Multimodal")).toBe(true);
    });

    it("returns alternative providers for gpt-oss-120b", () => {
      const { getModelProviderFallbacks } = modelsModule;
      const fallbacks = getModelProviderFallbacks("gpt-oss-120b", "OpenAI");

      expect(fallbacks).toEqual([
        { provider: "GroqWorker", model: "openai/gpt-oss-120b" },
        { provider: "Multimodal", model: "openai/gpt-oss-120b" },
      ]);
    });

    it("returns multi-provider fallbacks for DuckAI models when provider fails", () => {
      const { getModelProviderFallbacks } = modelsModule;
      const luna = getModelProviderFallbacks("gpt-5.6-luna", "OpenAI");
      expect(luna.some((f) => f.provider === "Multimodal")).toBe(true);
      expect(luna.some((f) => f.provider === "GroqWorker")).toBe(true);

      const mini = getModelProviderFallbacks("gpt-5.4-mini", "OpenAI");
      expect(mini.some((f) => f.provider === "Multimodal")).toBe(true);
      expect(mini.some((f) => f.provider === "GroqWorker")).toBe(true);

      const haiku = getModelProviderFallbacks("claude-haiku-4.5", "Anthropic");
      expect(haiku.some((f) => f.provider === "Multimodal")).toBe(true);

      const mistral = getModelProviderFallbacks("mistral-small-4", "Mistral");
      expect(mistral.some((f) => f.provider === "Multimodal")).toBe(true);

      const gemma = getModelProviderFallbacks("gemma-4-31b", "Google");
      expect(gemma.some((f) => f.provider === "Multimodal")).toBe(true);
    });

    it("instantiates models with explicit provider routing", () => {
      const { customModelProvider } = modelsModule;

      const budsaiModel = customModelProvider.getModel({
        provider: "BudsAI",
        model: "deepseek-v4-flash",
      });
      expect(budsaiModel).toBeDefined();

      const seekaiModel = customModelProvider.getModel({
        provider: "SeekAI",
        model: "deepseek-ai/DeepSeek-V4-Flash-0731",
      });
      expect(seekaiModel).toBeDefined();

      const deepseekModel = customModelProvider.getModel({
        provider: "DeepSeek",
        model: "deepseek-v4-flash:free",
      });
      expect(deepseekModel).toBeDefined();
    });
  });
});
