/**
 * Detects if a user message is a search query
 * and should use the gemini-search model
 *
 * Smart detection that avoids false positives like "tell me about you"
 */

// Patterns that STRONGLY indicate a search query
const STRONG_SEARCH_PATTERNS = [
  // Explicit search commands
  /^\s*(search|find|look\s+up|lookup)\s+/i,
  /search\s+for\s+/i,
  /find\s+me\s+/i,
  /show\s+me\s+/i,

  // Real-time data queries
  /\b(current|latest|today's?|today|this\s+week|this\s+month)\s+(price|weather|news|score|rate|forecast)/i,
  /\b(btc|bitcoin|eth|ethereum|crypto|stock)\s+(price|rate|value)/i,
  /\b(weather|temperature|forecast)\s+(in|for|today)/i,
  /\b(news|breaking|trending)\s+(about|on|today)/i,
  /\b(sports|game|match)\s+(score|result|today)/i,

  // Specific factual queries about current information
  /\b(what\s+is\s+the\s+(current|latest|today's?)|who\s+is\s+the\s+(current|latest))/i,
  /\b(when\s+is|where\s+is)\s+/i,
];

// Patterns that MIGHT be search queries but need context
const WEAK_SEARCH_PATTERNS = [
  // Generic "what is" questions (only if asking about external topics)
  /^\s*what\s+is\s+/i,
  /^\s*who\s+is\s+/i,
  /^\s*how\s+to\s+/i,
  /^\s*why\s+/i,
];

// Keywords that indicate the query is about external/real-world information
const EXTERNAL_TOPIC_KEYWORDS = [
  // Real-time data
  "price",
  "stock",
  "crypto",
  "btc",
  "eth",
  "bitcoin",
  "ethereum",
  "weather",
  "temperature",
  "forecast",
  "news",
  "breaking",
  "trending",
  "latest",
  "recent",
  "sports",
  "game",
  "match",
  "score",
  "result",
  "current",
  "today",
  "this week",
  "this month",
  "this year",

  // Specific entities/people/places
  "elon musk",
  "trump",
  "biden",
  "openai",
  "google",
  "meta",
  "new york",
  "london",
  "paris",
  "tokyo",
  "india",
  "2024",
  "2025",
];

// Keywords that indicate the query is about the AI itself (NOT a search)
const SELF_REFERENTIAL_KEYWORDS = [
  "you",
  "yourself",
  "your",
  "your name",
  "who are you",
  "what are you",
  "can you",
  "can you help",
  "help me",
  "explain",
  "tell me about you",
  "tell me about yourself",
  "how do you",
  "do you",
  "are you",
];

/**
 * Determines if a message is a search query
 * @param message The user's message
 * @returns true if the message appears to be a search query
 */
export function isSearchQuery(message: string): boolean {
  if (!message || message.trim().length === 0) {
    return false;
  }

  const lowerMessage = message.toLowerCase();

  // First, check if it's about the AI itself (self-referential)
  // These should NOT be treated as search queries
  for (const keyword of SELF_REFERENTIAL_KEYWORDS) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      return false; // Not a search query
    }
  }

  // Check for STRONG search patterns (high confidence)
  for (const pattern of STRONG_SEARCH_PATTERNS) {
    if (pattern.test(message)) {
      return true; // Definitely a search query
    }
  }

  // Check for WEAK search patterns with context
  for (const pattern of WEAK_SEARCH_PATTERNS) {
    if (pattern.test(message)) {
      // It matches a weak pattern, now check if it's about external topics
      for (const keyword of EXTERNAL_TOPIC_KEYWORDS) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          return true; // Search query about external topic
        }
      }
    }
  }

  return false;
}

/**
 * Extracts the search query from a message
 * @param message The user's message
 * @returns The cleaned search query
 */
export function extractSearchQuery(message: string): string {
  return message
    .replace(/^\s*(search\s+for|find|look\s+up|what\s+is|who\s+is)\s+/i, "")
    .trim();
}
