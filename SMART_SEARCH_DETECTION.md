# Smart Search Detection - Improved Logic

## Problem Fixed
The old search detection was too dumb - it triggered on "tell me about you" because it contained "tell me", causing it to use the search model for questions about the AI itself.

## Solution: Three-Tier Detection System

### Tier 1: Self-Referential Check (BLOCKS search)
If the message is about the AI itself, it's NOT a search query.

**Keywords that block search detection:**
- "you", "yourself", "your", "your name"
- "who are you", "what are you"
- "can you", "can you help", "help me"
- "explain", "tell me about you", "tell me about yourself"
- "how do you", "do you", "are you"

**Examples that DON'T trigger search:**
- ❌ "Tell me about you" → Uses selected model
- ❌ "What are you?" → Uses selected model
- ❌ "Can you help me?" → Uses selected model
- ❌ "Explain how you work" → Uses selected model

### Tier 2: Strong Search Patterns (CONFIRMS search)
High-confidence patterns that definitely indicate a search query.

**Strong patterns:**
- Explicit search commands: "search for", "find me", "show me"
- Real-time data: "current price", "latest news", "today's weather"
- Specific queries: "BTC price", "weather in New York", "sports score"
- Factual questions: "what is the current...", "who is the..."
- Location/time questions: "when is", "where is"

**Examples that TRIGGER search:**
- ✅ "Search for AI news" → Uses gemini-search
- ✅ "What is the current BTC price?" → Uses gemini-search
- ✅ "Latest weather in New York" → Uses gemini-search
- ✅ "Show me today's sports scores" → Uses gemini-search
- ✅ "Who is the current president?" → Uses gemini-search

### Tier 3: Weak Patterns with Context (CONDITIONAL search)
Generic patterns that might be search queries, but only if about external topics.

**Weak patterns:**
- "What is..." (only if about external topics)
- "Who is..." (only if about external topics)
- "How to..." (only if about external topics)
- "Why..." (only if about external topics)

**External topic keywords:**
- Real-time data: price, stock, crypto, btc, weather, news, sports
- Specific entities: Elon Musk, Trump, Biden, OpenAI, Google
- Locations: New York, London, Paris, Tokyo, India
- Time references: 2024, 2025, today, this week

**Examples:**
- ✅ "What is Bitcoin?" → Uses gemini-search (has "bitcoin" keyword)
- ✅ "Who is Elon Musk?" → Uses gemini-search (has "elon musk" keyword)
- ✅ "How to invest in crypto?" → Uses gemini-search (has "crypto" keyword)
- ❌ "What is a neural network?" → Uses selected model (no external keywords)
- ❌ "Who is the main character?" → Uses selected model (no external keywords)

## Detection Flow

```
User sends message
    ↓
Check if about AI itself (self-referential)?
    ├─ YES → NOT a search query (use selected model)
    └─ NO → Continue
    ↓
Check for STRONG search patterns?
    ├─ YES → IS a search query (use gemini-search)
    └─ NO → Continue
    ↓
Check for WEAK search patterns?
    ├─ NO → NOT a search query (use selected model)
    └─ YES → Check for external topic keywords
        ├─ YES → IS a search query (use gemini-search)
        └─ NO → NOT a search query (use selected model)
```

## Implementation

**File:** `/src/lib/search-detector.ts`

**Key functions:**
- `isSearchQuery(message: string): boolean` - Main detection function
- `extractSearchQuery(message: string): string` - Extracts clean query

**Detection arrays:**
- `SELF_REFERENTIAL_KEYWORDS` - Blocks search for AI-related questions
- `STRONG_SEARCH_PATTERNS` - High-confidence search patterns
- `WEAK_SEARCH_PATTERNS` - Generic patterns needing context
- `EXTERNAL_TOPIC_KEYWORDS` - Keywords indicating external topics

## Test Cases

### Should NOT trigger search (use selected model):
```
"Tell me about you"
"What are you?"
"Can you help me?"
"Explain how you work"
"What is a neural network?"
"Who is the main character in the book?"
"How do you process information?"
"Do you have feelings?"
```

### Should trigger search (use gemini-search):
```
"Search for AI news"
"What is the current BTC price?"
"Latest weather in New York"
"Show me today's sports scores"
"Who is Elon Musk?"
"When is the next election?"
"Where is the Eiffel Tower?"
"How to invest in cryptocurrency?"
"Tell me about the latest AI developments"
"What is trending on Twitter today?"
```

## Benefits

✅ **Smarter detection** - Avoids false positives
✅ **Context-aware** - Understands intent, not just keywords
✅ **Self-referential handling** - Knows when questions are about the AI
✅ **External topic awareness** - Recognizes real-world information needs
✅ **Flexible** - Easy to add more keywords or patterns

## Future Improvements

1. Add more self-referential keywords as needed
2. Add more external topic keywords
3. Add sentiment analysis to detect opinion vs. fact-seeking
4. Add NLP-based intent detection
5. Track user feedback to improve patterns
