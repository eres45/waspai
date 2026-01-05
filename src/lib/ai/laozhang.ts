import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";

/**
 * LaoZhang API Integration
 * Provides access to cutting-edge models like Claude 3.7, Claude 4, and GPT-4.1/5.0.
 */
export function createLaoZhangModels() {
  const apiKey =
    process.env.LAOZHANG_API_KEY ||
    "sk-QDL7lAoCzFaGa1pb9e14263b318b4aB7BaB1E3AfB8912bE8";
  const baseURL = process.env.LAOZHANG_BASE_URL || "https://api.laozhang.ai/v1";

  const provider = createOpenAICompatible({
    name: "laozhang",
    baseURL,
    apiKey,
  });

  const modelIds = [
    // === CLAUDE ===
    "claude-3-5-haiku-latest",
    "claude-3-5-sonnet-latest",
    "claude-3-7-sonnet-latest",
    "claude-3-7-sonnet-20250219-thinking",
    "claude-3-opus-20240229",
    "claude-haiku-4-5-20251001",
    "claude-opus-4-20250514",
    "claude-opus-4-1-20250805",
    "claude-opus-4-5-20251101",
    "claude-sonnet-4-20250514",
    "claude-sonnet-4-5-20250929",
    "cld-3-7-sonnet-20250219",
    "cld-opus-4-20250514",
    "cld-sonnet-4-20250514",

    // === GEMINI ===
    "gemini-1.5-pro-latest",
    "gemini-2.0-flash-001",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.5-pro-thinking",
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
    "gemini-3-pro-preview-thinking",

    // === GPT / OPENAI ===
    "chatgpt-4o-latest",
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4o",
    "gpt-5",
    "gpt-5-pro",
    "gpt-5-mini",
    "gpt-5.1",
    "gpt-5.2",

    // === O-SERIES (REASONING) ===
    "o1",
    "o1-pro",
    "o3",
    "o3-pro",
    "o3-mini",
    "o4-mini",
    "o4-mini-high",

    // === GROK ===
    "grok-3-latest",
    "grok-3-reasoning",
    "grok-4-latest",
    "grok-4-deepsearch",

    // === DEEPSEEK ===
    "deepseek-v3",
    "deepseek-r1",
  ];

  const models: Record<string, LanguageModel> = {};

  modelIds.forEach((id) => {
    // Standardize key name
    const key = id.replace(/\//g, "-");
    models[key] = provider(id);
  });

  return models;
}
