/**
 * nvidia.ts — Legacy shim.
 * NVIDIA NIM models are now served through the unified AI worker.
 */
import { LanguageModel } from "ai";
import { allModels } from "./models";

export function createNvidiaModels(): Record<string, LanguageModel> {
  // Return NVIDIA models from the unified catalog
  return allModels["NVIDIA"] ?? {};
}
