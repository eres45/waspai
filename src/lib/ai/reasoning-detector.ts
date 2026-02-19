/**
 * Reasoning Detection and Stripping Utility
 *
 * Handles detection and extraction of reasoning text from AI models that
 * output their internal thinking as part of regular responses (reasoning leakage).
 */

// =============================================================================
// MODEL CLASSIFICATION REGISTRY
// =============================================================================

/**
 * Models that leak reasoning as regular text (need stripping)
 */
export const REASONING_LEAKY_MODELS = [
  // DeepSeek Family (R1 variants are the worst offenders)
  /deepseek.*r1/i,
  /deepseek.*v3/i,
  /deepseek.*coder/i,

  // Qwen Thinking Models
  /qwen.*thinking/i,
  /qwen.*next.*thinking/i,
  /kimi.*thinking/i,

  // GLM Reasoning Models
  /glm.*reasoning/i,
  /glm-4\.7/i,
  /glm-4\.6/i,

  // OpenAI O-series (ALL of them use chain-of-thought that leaks)
  /^o1$/,
  /^o1-/,
  /^o3$/,
  /^o3-/,
  /^o4$/,
  /^o4-/,

  // Grok Reasoning
  /grok.*reasoning/i,
  /grok.*deepsearch/i,
];

/**
 * Models that properly structure reasoning (DO NOT TOUCH)
 * These use provider metadata and work correctly.
 */
export const REASONING_STRUCTURED_MODELS = [
  // Claude Thinking variants
  /claude.*thinking/i,
  /claude-3-7.*thinking/i,

  // Gemini Thinking variants
  /gemini.*thinking/i,
  /gemini.*pro.*thinking/i,
];

// =============================================================================
// REASONING PATTERN DETECTION
// =============================================================================

/**
 * Common reasoning markers used by different model families
 */
const REASONING_PATTERNS = [
  // GLM-style details tags (most common for GLM models)
  {
    start: /<details\s+type=["']reasoning["'][^>]*>/gi,
    end: /<\/details>/gi,
    name: "glm-details" as const,
    isAnswer: false,
  },
  // XML-style tags (DeepSeek, GLM)
  {
    start: /<think>/gi,
    end: /<\/think>/gi,
    name: "xml-think" as const,
    isAnswer: false,
  },
  {
    start: /<thinking>/gi,
    end: /<\/thinking>/gi,
    name: "xml-thinking" as const,
    isAnswer: false,
  },
  {
    start: /<reasoning>/gi,
    end: /<\/reasoning>/gi,
    name: "xml-reasoning" as const,
    isAnswer: false,
  },
  {
    start: /<answer>/gi,
    end: /<\/answer>/gi,
    name: "xml-answer" as const,
    isAnswer: true, // Keep this content
  },

  // Markdown-style delimiters
  {
    start: /```thinking/gi,
    end: /```/gi,
    name: "md-thinking" as const,
    isAnswer: false,
  },
  {
    start: /\*\*Thinking:\*\*/gi,
    end: /\*\*Answer:\*\*/gi,
    name: "bold-thinking" as const,
    isAnswer: false,
  },
] as const;

/**
 * Natural language reasoning markers
 * These indicate the START of reasoning text
 */
const NL_REASONING_MARKERS = [
  // Common chain-of-thought phrases
  "Let me think",
  "Let's think",
  "Let me break this down",
  "Let's break this down",
  "Let's approach this step by step",
  "Let me analyze",
  "Let's analyze",
  "Hmm, let me think",
  "Wait, let me reconsider",
  "Upon reflection",
  "Actually, thinking about it",

  // Step-by-step indicators
  "First,",
  "Second,",
  "Third,",
  "Next,",
  "Finally,",
  "Step 1:",
  "Step 2:",

  // DeepSeek specific
  "Okay, so",
  "Well,",
  "Hmm,",
] as const;

/**
 * Natural language answer markers
 * These indicate the END of reasoning and START of final answer
 */
const NL_ANSWER_MARKERS = [
  "The answer is:",
  "So, the answer is:",
  "Therefore,",
  "In conclusion,",
  "To summarize,",
  "Final answer:",
  "Here's the answer:",
  "Here is the answer:",
  "So the final answer is:",
  "Putting it all together:",
] as const;

// =============================================================================
// DETECTION FUNCTIONS
// =============================================================================

/**
 * Check if a model is known to leak reasoning
 */
export function isLeakyReasoningModel(modelId: string): boolean {
  if (!modelId) return false;
  return REASONING_LEAKY_MODELS.some((pattern) => pattern.test(modelId));
}

/**
 * Check if a model uses structured reasoning (don't strip)
 */
export function isStructuredReasoningModel(modelId: string): boolean {
  if (!modelId) return false;
  return REASONING_STRUCTURED_MODELS.some((pattern) => pattern.test(modelId));
}

// =============================================================================
// REASONING EXTRACTION & STRIPPING
// =============================================================================

interface ReasoningExtraction {
  reasoning: string;
  cleanText: string;
  hasReasoning: boolean;
}

/**
 * Extract reasoning from text that uses explicit delimiters/tags
 */
function extractDelimitedReasoning(text: string): ReasoningExtraction {
  let cleanText = text;
  let reasoning = "";
  let hasReasoning = false;

  for (const pattern of REASONING_PATTERNS) {
    // Skip answer tags (we want to keep those)
    if (pattern.isAnswer) continue;

    const regex = new RegExp(
      `${pattern.start.source}([\\s\\S]*?)${pattern.end.source}`,
      "gi",
    );

    const matches = text.match(regex);
    if (matches) {
      hasReasoning = true;
      matches.forEach((match) => {
        // Extract content between tags
        const content = match
          .replace(pattern.start, "")
          .replace(pattern.end, "")
          .trim();

        if (content) {
          reasoning += (reasoning ? "\n\n" : "") + content;
        }

        // Remove from clean text
        cleanText = cleanText.replace(match, "").trim();
      });
    }
  }

  return {
    reasoning,
    cleanText,
    hasReasoning,
  };
}

/**
 * Extract reasoning from natural language patterns
 * (Heuristic-based for models like O1, DeepSeek R1)
 */
function extractNaturalLanguageReasoning(text: string): ReasoningExtraction {
  let cleanText = text;
  let reasoning = "";
  let hasReasoning = false;

  // Check if text starts with reasoning markers
  const startsWithReasoning = NL_REASONING_MARKERS.some((marker) =>
    text.toLowerCase().trim().startsWith(marker.toLowerCase()),
  );

  if (startsWithReasoning) {
    // Find where the answer starts
    let answerStart = -1;

    for (const marker of NL_ANSWER_MARKERS) {
      const index = text.toLowerCase().indexOf(marker.toLowerCase());
      if (index !== -1 && (answerStart === -1 || index < answerStart)) {
        answerStart = index;
      }
    }

    if (answerStart !== -1) {
      // Everything before the answer marker is reasoning
      reasoning = text.substring(0, answerStart).trim();
      cleanText = text.substring(answerStart).trim();
      hasReasoning = true;
    } else {
      // If no answer marker found, check if text is mostly reasoning
      // (heuristic: if it contains multiple step markers, it's likely all reasoning)
      const stepCount = (
        text.match(/\b(first|second|third|next|finally|step \d+)/gi) || []
      ).length;

      if (stepCount >= 3) {
        // Likely all reasoning, no clear answer
        reasoning = text;
        cleanText = ""; // Will be handled separately
        hasReasoning = true;
      }
    }
  }

  return {
    reasoning,
    cleanText,
    hasReasoning,
  };
}

/**
 * Main function: Strip reasoning from text
 *
 * @param text - The raw text from the model
 * @param modelId - The model identifier
 * @returns Object with separated reasoning and clean text
 */
export function stripReasoning(
  text: string,
  modelId: string,
): ReasoningExtraction {
  // Quick escape if no reasoning expected
  if (!text || !isLeakyReasoningModel(modelId)) {
    return {
      reasoning: "",
      cleanText: text,
      hasReasoning: false,
    };
  }

  // Try delimited extraction first (most reliable)
  const delimited = extractDelimitedReasoning(text);
  if (delimited.hasReasoning) {
    return delimited;
  }

  // Fall back to natural language extraction
  const natural = extractNaturalLanguageReasoning(text);
  if (natural.hasReasoning) {
    return natural;
  }

  // No reasoning detected
  return {
    reasoning: "",
    cleanText: text,
    hasReasoning: false,
  };
}
