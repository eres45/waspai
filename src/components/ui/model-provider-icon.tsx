import { BlendIcon, BotIcon } from "lucide-react";
import { ClaudeIcon } from "./claude-icon";
import { GeminiIcon } from "./gemini-icon";
import { GrokIcon } from "./grok-icon";
import { OpenAIIcon } from "./openai-icon";
import { OllamaIcon } from "./ollama-icon";
import { OpenRouterIcon } from "./open-router-icon";
import { MicrosoftIcon } from "./microsoft-icon";

export function ModelProviderIcon({
  provider,
  className,
}: { provider: string; className?: string }) {
  const p = provider?.toLowerCase() || "";
  return p === "openai" ? (
    <OpenAIIcon className={className} />
  ) : p === "xai" || p === "grok" ? (
    <GrokIcon className={className} />
  ) : p === "anthropic" || p === "claude" ? (
    <ClaudeIcon className={className} />
  ) : p === "google" || p === "gemini" ? (
    <GeminiIcon className={className} />
  ) : p === "ollama" ? (
    <OllamaIcon className={className} />
  ) : p === "openrouter" ? (
    <OpenRouterIcon className={className} />
  ) : p === "microsoft" || p === "phi" ? (
    <MicrosoftIcon className={className} />
  ) : p === "qwen" || p === "meta" || p === "llama" || p === "deepseek" ? (
    <BotIcon className={className} />
  ) : (
    <BlendIcon className={className} />
  );
}
