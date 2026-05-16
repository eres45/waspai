import { buildDynamicModelsInfo } from "lib/ai/models";

// Provider display order
const PROVIDER_ORDER = [
  "Anthropic",
  "OpenAI",
  "Google",
  "xAI",
  "DeepSeek",
  "Moonshot",
  "MiniMax",
  "Perplexity",
  "Qwen",
  "Meta",
  "Mistral",
  "Microsoft",
  "NVIDIA",
  "Z-AI",
  "StepFun",
  "Xiaomi",
  "Other",
];

export const dynamic = "force-dynamic"; // always fetch fresh from worker

export const GET = async () => {
  const modelsInfo = await buildDynamicModelsInfo();

  const sorted = modelsInfo.sort((a, b) => {
    const aIdx = PROVIDER_ORDER.indexOf(a.provider);
    const bIdx = PROVIDER_ORDER.indexOf(b.provider);
    const aOrder = aIdx === -1 ? PROVIDER_ORDER.length : aIdx;
    const bOrder = bIdx === -1 ? PROVIDER_ORDER.length : bIdx;
    return aOrder - bOrder;
  });

  return Response.json(sorted);
};
