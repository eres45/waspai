/**
 * nvidia.ts — Legacy shim.
 * NVIDIA models are now served through the unified AI worker.
 */
import { LanguageModel } from "ai";

export function createNvidiaModels(): Record<string, LanguageModel> {
  // No longer needed — unified worker handles all NVIDIA models.
  return {};
}
