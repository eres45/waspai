/**
 * workers.ts — Legacy worker models.
 * These are now routed through the unified AI worker.
 * Kept as a thin re-export for any code that still imports from here.
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";
import { UNIFIED_WORKER_URL } from "./models";

const unifiedProvider = createOpenAICompatible({
  name: "Unified AI Worker",
  apiKey: "dummy",
  baseURL: `${UNIFIED_WORKER_URL}/v1`,
});

export function createWorkersModels(): Record<string, LanguageModel> {
  return {
    "claude-sonnet-4.5-proxy": unifiedProvider("claude-sonnet-4.5"),
    "glm-4.7": unifiedProvider("z-ai/glm4.7"),
    "glm-4.5-air": unifiedProvider("glm-4.5-air"),
    wormgpt: unifiedProvider("wormgpt"),
    "glm-5": unifiedProvider("z-ai/glm5"),
    "kimi-k2-instruct": unifiedProvider("moonshotai/kimi-k2-instruct"),
  };
}
