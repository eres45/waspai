/**
 * workers.ts — Legacy shim.
 * All models now route through the unified AI worker.
 */
import { LanguageModel } from "ai";
import { unifiedProvider } from "./models";

export function createWorkersModels(): Record<string, LanguageModel> {
  return {
    "claude-sonnet-4.5-proxy": unifiedProvider("claude-sonnet-4.5") as unknown as LanguageModel,
    "glm-4.7": unifiedProvider("z-ai/glm4.7") as unknown as LanguageModel,
    "glm-4.5-air": unifiedProvider("glm-4.5-air") as unknown as LanguageModel,
    wormgpt: unifiedProvider("wormgpt") as unknown as LanguageModel,
    "glm-5": unifiedProvider("z-ai/glm5") as unknown as LanguageModel,
    "kimi-k2-instruct": unifiedProvider("moonshotai/kimi-k2-instruct") as unknown as LanguageModel,
  };
}
