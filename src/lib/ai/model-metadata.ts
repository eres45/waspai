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
      "Anthropic's latest flagship model featuring advanced writing, coding, and agentic reasoning.",
    contextLength: "200K tokens",
    toolsSupported: true,
    inputCost: "$3.000/1M",
    outputCost: "$15.000/1M",
  },
  "claude-sonnet": {
    description:
      "Anthropic's standard 3.7 model offering state-of-the-art developer tools and coding proficiency.",
    contextLength: "200K tokens",
    toolsSupported: true,
    inputCost: "$3.000/1M",
    outputCost: "$15.000/1M",
  },
  "claude-3-sonnet": {
    description:
      "Anthropic's widely-adopted balanced model for coding and complex workflows.",
    contextLength: "200K tokens",
    toolsSupported: true,
    inputCost: "$3.000/1M",
    outputCost: "$15.000/1M",
  },
  "claude-haiku-4-5": {
    description:
      "Anthropic's blazing fast, cost-efficient model for simple high-throughput tasks.",
    contextLength: "200K tokens",
    toolsSupported: true,
    inputCost: "$0.250/1M",
    outputCost: "$1.250/1M",
  },
  "claude-opus-4-7": {
    description:
      "Anthropic's massive-scale deep reasoning model for complex academic applications.",
    contextLength: "200K tokens",
    toolsSupported: true,
    inputCost: "$15.000/1M",
    outputCost: "$75.000/1M",
  },
  "claude-opus-4-7-no-tools": {
    description:
      "Anthropic's massive-scale deep reasoning model optimized for direct chats without tools.",
    contextLength: "200K tokens",
    toolsSupported: false,
    inputCost: "$15.000/1M",
    outputCost: "$75.000/1M",
  },
  // Frenix Meta Llama (State-of-the-art open-weights)
  "frenix-llama-3.1-70b": {
    description:
      "Meta's standard 70B model, perfect for general dialog and summarization.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.500/1M",
    outputCost: "$2.000/1M",
  },
  "frenix-llama-3.2-11b-vision": {
    description:
      "Meta's visual-reasoning model optimized for image-to-text and chart analysis.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.150/1M",
    outputCost: "$0.600/1M",
  },
  "frenix-llama-3.3-70b": {
    description:
      "Meta's flagship open-weights model, excellent for multi-lingual reasoning.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.600/1M",
    outputCost: "$2.400/1M",
  },
  "frenix-llama-4-maverick": {
    description:
      "Next-gen Meta Llama 4 maverick prototype offering lightweight speed and quality.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.800/1M",
    outputCost: "$3.200/1M",
  },
  // Frenix Google Gemma
  "frenix-gemma-4-31b": {
    description:
      "Google's next-gen open weights LLM offering powerful reasoning in a 31B footprint.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.300/1M",
    outputCost: "$1.200/1M",
  },
  "frenix-gemma-3n-e2b": {
    description:
      "Google's lightweight Gemma 3 variant offering high efficiency and quick answers.",
    contextLength: "64K tokens",
    toolsSupported: true,
    inputCost: "$0.050/1M",
    outputCost: "$0.200/1M",
  },
  // Frenix Mistral models
  "frenix-ministral-14b": {
    description:
      "Mistral AI's premium low-latency model for fast on-device generation.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.100/1M",
    outputCost: "$0.400/1M",
  },
  "frenix-mistral-large": {
    description:
      "Mistral AI's massive state-of-the-art flagship LLM for multilingual logic.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$2.000/1M",
    outputCost: "$6.000/1M",
  },
  "frenix-mistral-nemotron": {
    description:
      "Mistral and NVIDIA co-developed model optimized for instruction following.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.250/1M",
    outputCost: "$0.750/1M",
  },
  "frenix-mixtral-8x7b": {
    description:
      "Mistral AI's Mixture of Experts (MoE) architecture offering premium efficiency.",
    contextLength: "32K tokens",
    toolsSupported: true,
    inputCost: "$0.240/1M",
    outputCost: "$0.240/1M",
  },
  // Frenix Microsoft
  "frenix-phi-4-multimodal": {
    description:
      "Microsoft's lightweight vision and audio model for natural interactions.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.150/1M",
    outputCost: "$0.600/1M",
  },
  // Frenix NVIDIA
  "frenix-nemotron-mini-4b": {
    description:
      "NVIDIA's small and highly optimized model for rapid system-level actions.",
    contextLength: "32K tokens",
    toolsSupported: true,
    inputCost: "$0.050/1M",
    outputCost: "$0.200/1M",
  },
  "frenix-nemotron-nano-12b-vl": {
    description:
      "NVIDIA's multimodal vision-language model for visual information analysis.",
    contextLength: "32K tokens",
    toolsSupported: true,
    inputCost: "$0.150/1M",
    outputCost: "$0.600/1M",
  },
  "frenix-nemotron-nano-9b": {
    description:
      "NVIDIA's compact text-only model built for high-speed system dialogs.",
    contextLength: "32K tokens",
    toolsSupported: true,
    inputCost: "$0.070/1M",
    outputCost: "$0.280/1M",
  },
  "frenix-riva-translate": {
    description:
      "NVIDIA's highly-specialized real-time translation processing engine.",
    contextLength: "16K tokens",
    toolsSupported: false,
    inputCost: "$0.100/1M",
    outputCost: "$0.400/1M",
  },
  // Frenix Other models
  "frenix-axion-1.5-pro": {
    description:
      "High-intelligence reasoning engine built for scientific and data analysis.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$1.500/1M",
    outputCost: "$4.500/1M",
  },
  "frenix-axion-1.5-pro-free": {
    description:
      "Free tier access to the Axion 1.5 Pro intelligence reasoning model.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$1.500/1M",
    outputCost: "$4.500/1M",
  },
  "frenix-glm-5": {
    description:
      "Zhipu AI's flagship reasoning model optimized for complex logic and math.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$1.000/1M",
    outputCost: "$3.000/1M",
  },
  "frenix-glm-4.7": {
    description:
      "Zhipu AI's general reasoning engine offering strong multilingual abilities.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.600/1M",
    outputCost: "$1.800/1M",
  },
  "frenix-minimax-m2.5": {
    description:
      "High-efficiency conversation and storytelling engine with natural phrasing.",
    contextLength: "64K tokens",
    toolsSupported: true,
    inputCost: "$0.400/1M",
    outputCost: "$1.200/1M",
  },
  "frenix-turbo": {
    description:
      "Perplexity's high-speed search-optimized LLM for rapid factual queries.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.800/1M",
    outputCost: "$3.200/1M",
  },
  // Other standard models in our catalog
  "gpt-oss-120b": {
    description:
      "Massive open-source model tuned for versatile instruction following.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.500/1M",
    outputCost: "$1.500/1M",
  },
  "openai-gpt-oss-120b": {
    description:
      "Massive open-source model tuned for versatile instruction following.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.500/1M",
    outputCost: "$1.500/1M",
  },
  "gpt-oss-120b-p2": {
    description: "Optimized partition of the massive open-source 120B model.",
    contextLength: "128K tokens",
    toolsSupported: true,
    inputCost: "$0.500/1M",
    outputCost: "$1.500/1M",
  },
  "gemini-2.5-flash": {
    description:
      "Google's ultra-fast flagship multimodal model for text, images, and media.",
    contextLength: "1M tokens",
    toolsSupported: true,
    inputCost: "$0.075/1M",
    outputCost: "$0.300/1M",
  },
  "gemini-2.5-flash-lite": {
    description:
      "Google's lightest Gemini model designed for near-instant responses.",
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
    "Advanced large language model optimized for high-quality text generation.";
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
