export interface ModelMetadata {
  description: string;
  contextLength: string;
  toolsSupported: boolean;
  inputCost: string;
  outputCost: string;
}

export const MODEL_METADATA_MAP: Record<string, ModelMetadata> = {
  // Anthropic Claude (Flagship reasoning models)
  "claude-sonnet-4.5-proxy": {
    description:
      "Anthropic's latest flagship model featuring advanced agentic capability, writing excellence, and state-of-the-art coding and reasoning.",
    contextLength: "200K tokens",
    toolsSupported: true,
    inputCost: "$3.000/1M",
    outputCost: "$15.000/1M",
  },
  "claude-sonnet": {
    description:
      "Anthropic's standard 3.7 model offering state-of-the-art developer tool-calling, coding proficiency, and dynamic output formatting.",
    contextLength: "200K tokens",
    toolsSupported: true,
    inputCost: "$3.000/1M",
    outputCost: "$15.000/1M",
  },
  "claude-3-sonnet": {
    description:
      "Anthropic's widely-adopted balanced model, highly popular for coding, complex logical workflows, and natural conversations.",
    contextLength: "200K tokens",
    toolsSupported: true,
    inputCost: "$3.000/1M",
    outputCost: "$15.000/1M",
  },
  "claude-haiku-4-5": {
    description:
      "Anthropic's blazing fast, cost-efficient model ideal for high-throughput simple tasks, quick translations, and low-latency chats.",
    contextLength: "200K tokens",
    toolsSupported: true,
    inputCost: "$0.250/1M",
    outputCost: "$1.250/1M",
  },
  "claude-opus-4-7": {
    description:
      "Anthropic's massive-scale ultra-deep reasoning model for complex academic, mathematical, and highly experimental applications.",
    contextLength: "200K tokens",
    toolsSupported: true,
    inputCost: "$15.000/1M",
    outputCost: "$75.000/1M",
  },
  "claude-opus-4-7-no-tools": {
    description:
      "Anthropic's massive-scale ultra-deep reasoning model, optimized specifically for fast-response direct reasoning without tools.",
    contextLength: "200K tokens",
    toolsSupported: false,
    inputCost: "$15.000/1M",
    outputCost: "$75.000/1M",
  },
  // Frenix Meta Llama (State-of-the-art open-weights)
  "frenix-llama-3.1-70b": {
    description:
      "Meta's standard 70B model, perfect for general purpose dialog, summarization, and high-quality data extraction.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.500/1M",
    outputCost: "$2.000/1M",
  },
  "frenix-llama-3.2-11b-vision": {
    description:
      "Meta's visual-reasoning model optimized for image-to-text generation, document reading, and chart analysis.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.150/1M",
    outputCost: "$0.600/1M",
  },
  "frenix-llama-3.3-70b": {
    description:
      "Meta's flagship open-weights model, excellent for multi-lingual instruction following, reasoning, and synthesis.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.600/1M",
    outputCost: "$2.400/1M",
  },
  "frenix-llama-4-maverick": {
    description:
      "Next-generation Meta Llama 4 maverick prototype offering lightweight speed combined with high-quality instructions.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.800/1M",
    outputCost: "$3.200/1M",
  },
  // Frenix Google Gemma
  "frenix-gemma-4-31b": {
    description:
      "Google's next-generation open weights LLM offering powerful reasoning, coding, and logical comprehension in a 31B footprint.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.30/1M",
    outputCost: "$1.20/1M",
  },
  "frenix-gemma-3n-e2b": {
    description:
      "Google's lightweight Gemma 3 variant offering high efficiency and quick responsive answers.",
    contextLength: "64K tokens",
    toolsSupported: true,
    inputCost: "$0.05/1M",
    outputCost: "$0.20/1M",
  },
  // Frenix Mistral models
  "frenix-ministral-14b": {
    description:
      "Mistral AI's premium low-latency on-device model, specialized in fast generation and efficient coding tasks.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.10/1M",
    outputCost: "$0.40/1M",
  },
  "frenix-mistral-large": {
    description:
      "Mistral AI's massive state-of-the-art flagship LLM, rivaling proprietary models in multilingual understanding and logic.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$2.00/1M",
    outputCost: "$6.00/1M",
  },
  "frenix-mistral-nemotron": {
    description:
      "Co-developed by Mistral AI and NVIDIA, highly optimized for system instructions and instruction-following accuracy.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.25/1M",
    outputCost: "$0.75/1M",
  },
  "frenix-mixtral-8x7b": {
    description:
      "Mistral AI's revolutionary Mixture of Experts (MoE) architecture, providing premium performance with high efficiency.",
    contextLength: "32K tokens",
    toolsSupported: true,
    inputCost: "$0.24/1M",
    outputCost: "$0.24/1M",
  },
  // Frenix Microsoft
  "frenix-phi-4-multimodal": {
    description:
      "Microsoft's lightweight and state-of-the-art vision and audio processing LLM, designed for natural-language interactions.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.15/1M",
    outputCost: "$0.60/1M",
  },
  // Frenix NVIDIA
  "frenix-nemotron-mini-4b": {
    description:
      "NVIDIA's small and highly optimized model, designed specifically for rapid system-level actions and quick answers.",
    contextLength: "32K tokens",
    toolsSupported: true,
    inputCost: "$0.05/1M",
    outputCost: "$0.20/1M",
  },
  "frenix-nemotron-nano-12b-vl": {
    description:
      "NVIDIA's multimodal vision-language model, built to accurately read, analyze, and describe visual information.",
    contextLength: "32K tokens",
    toolsSupported: true,
    inputCost: "$0.15/1M",
    outputCost: "$0.60/1M",
  },
  "frenix-nemotron-nano-9b": {
    description:
      "NVIDIA's compact text-only model built for high-speed, general-purpose system dialogs.",
    contextLength: "32K tokens",
    toolsSupported: true,
    inputCost: "$0.07/1M",
    outputCost: "$0.28/1M",
  },
  "frenix-riva-translate": {
    description:
      "NVIDIA's highly-specialized real-time translation and multi-lingual processing engine.",
    contextLength: "16K tokens",
    toolsSupported: false,
    inputCost: "$0.10/1M",
    outputCost: "$0.40/1M",
  },
  // Frenix Other models
  "frenix-axion-1.5-pro": {
    description:
      "High-intelligence reasoning engine built for scientific, mathematical, and data analysis tasks.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$1.50/1M",
    outputCost: "$4.50/1M",
  },
  "frenix-axion-1.5-pro-free": {
    description:
      "Free tier access to the Axion 1.5 Pro intelligence and reasoning model.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$1.50/1M",
    outputCost: "$4.50/1M",
  },
  "frenix-glm-5": {
    description:
      "Zhipu AI's flagship reasoning model, highly optimized for multi-step math problems and complex logic puzzles.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$1.00/1M",
    outputCost: "$3.00/1M",
  },
  "frenix-glm-4.7": {
    description:
      "Zhipu AI's powerful general reasoning engine offering strong multilingual abilities and detailed coding help.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.60/1M",
    outputCost: "$1.80/1M",
  },
  "frenix-minimax-m2.5": {
    description:
      "High-efficiency conversation and narrative-generation engine with natural phrasing and storytelling talent.",
    contextLength: "64K tokens",
    toolsSupported: true,
    inputCost: "$0.40/1M",
    outputCost: "$1.20/1M",
  },
  "frenix-turbo": {
    description:
      "Perplexity's high-speed search-optimized LLM, built for answering factual queries rapidly with accurate insights.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.80/1M",
    outputCost: "$3.20/1M",
  },
  // Other standard models in our catalog
  "gpt-oss-120b": {
    description:
      "Massive open-source large language model, fine-tuned for versatile instruction following and deep reasoning.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.50/1M",
    outputCost: "$1.50/1M",
  },
  "openai-gpt-oss-120b": {
    description:
      "Massive open-source large language model, fine-tuned for versatile instruction following and deep reasoning.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.50/1M",
    outputCost: "$1.50/1M",
  },
  "gpt-oss-120b-p2": {
    description:
      "Optimized partition of the massive open-source 120B model, tuned for maximum output quality and consistency.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.50/1M",
    outputCost: "$1.50/1M",
  },
  "gemini-2.5-flash": {
    description:
      "Google's ultra-fast flagship multimodal model, highly efficient and perfect for audio, video, image, and text tasks.",
    contextLength: "1M tokens",
    toolsSupported: true,
    inputCost: "$0.075/1M",
    outputCost: "$0.30/1M",
  },
  "gemini-2.5-flash-lite": {
    description:
      "Google's lightest, most cost-effective Gemini model, designed for high-frequency, near-instantaneous responses.",
    contextLength: "1M tokens",
    toolsSupported: true,
    inputCost: "$0.038/1M",
    outputCost: "$0.150/1M",
  },
};

export function getModelMetadata(
  modelId: string,
  provider?: string,
  isToolCallUnsupported?: boolean,
): ModelMetadata {
  const cleanId = modelId?.toLowerCase() || "";
  const prov = provider?.toLowerCase() || "";

  // 1. If exact match in map, return it
  if (MODEL_METADATA_MAP[modelId]) {
    const meta = { ...MODEL_METADATA_MAP[modelId] };
    if (isToolCallUnsupported !== undefined) {
      meta.toolsSupported = !isToolCallUnsupported;
    }
    return meta;
  }

  // 2. Check cleanId match
  if (MODEL_METADATA_MAP[cleanId]) {
    const meta = { ...MODEL_METADATA_MAP[cleanId] };
    if (isToolCallUnsupported !== undefined) {
      meta.toolsSupported = !isToolCallUnsupported;
    }
    return meta;
  }

  // 3. Fallback intelligence based on provider and name patterns
  let description =
    "Advanced generative large language model designed to deliver high-quality text and instruction following.";
  let contextLength = "128K tokens";
  const toolsSupported =
    isToolCallUnsupported !== undefined ? !isToolCallUnsupported : true;
  let inputCost = "$0.50/1M";
  let outputCost = "$1.50/1M";

  // Google / Gemini
  if (
    prov === "google" ||
    prov === "gemini" ||
    cleanId.includes("gemini") ||
    cleanId.includes("gemma")
  ) {
    contextLength = cleanId.includes("gemini") ? "1M tokens" : "128K tokens";
    description = cleanId.includes("gemini")
      ? "Google's next-generation multimodal flagship, capable of analyzing massive contexts across text and media."
      : "Google's highly-efficient open-weights large language model built for fast, logical reasoning.";
    inputCost = cleanId.includes("gemini") ? "$0.075/1M" : "$0.10/1M";
    outputCost = cleanId.includes("gemini") ? "$0.30/1M" : "$0.40/1M";
  }
  // Anthropic / Claude
  else if (
    prov === "anthropic" ||
    prov === "claude" ||
    cleanId.includes("claude")
  ) {
    contextLength = "200K tokens";
    description =
      "Anthropic's premier conversational engine with advanced instruction adherence, coding capability, and reasoning.";
    if (cleanId.includes("haiku")) {
      description =
        "Anthropic's ultra-fast model, optimized for speed, cost-effectiveness, and low-latency interactions.";
      inputCost = "$0.25/1M";
      outputCost = "$1.25/1M";
    } else if (cleanId.includes("opus")) {
      description =
        "Anthropic's highly experimental academic model, built to solve the most difficult and complex reasoning tasks.";
      inputCost = "$15.00/1M";
      outputCost = "$75.00/1M";
    } else {
      inputCost = "$3.00/1M";
      outputCost = "$15.00/1M";
    }
  }
  // Meta / Llama
  else if (prov === "meta" || cleanId.includes("llama")) {
    contextLength = "128K tokens";
    description =
      "Meta Llama's leading open-weights model, excellent for multi-turn conversations, synthesis, and processing.";
    if (cleanId.includes("8b")) {
      inputCost = "$0.10/1M";
      outputCost = "$0.40/1M";
    } else {
      inputCost = "$0.60/1M";
      outputCost = "$2.40/1M";
    }
  }
  // Qwen
  else if (prov === "qwen" || cleanId.includes("qwen")) {
    contextLength = "128K tokens";
    description =
      "Alibaba's advanced multilingual flagship model, highly proficient in mathematics, coding, and translation.";
    inputCost = "$0.40/1M";
    outputCost = "$1.60/1M";
  }
  // DeepSeek
  else if (prov === "deepseek" || cleanId.includes("deepseek")) {
    contextLength = "64K tokens";
    description =
      "DeepSeek AI's efficient reasoning and coding model, optimized for complex logical workflows and mathematics.";
    inputCost = "$0.14/1M";
    outputCost = "$0.28/1M";
  }
  // Grok / xAI
  else if (prov === "xai" || prov === "grok" || cleanId.includes("grok")) {
    contextLength = "128K tokens";
    description =
      "xAI's Grok model offering deep real-time information processing, wit, and logical instruction adherence.";
    inputCost = "$0.80/1M";
    outputCost = "$3.20/1M";
  }

  return {
    description,
    contextLength,
    toolsSupported,
    inputCost,
    outputCost,
  };
}
