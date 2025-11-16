# Auto Search Detection - Implementation Guide

## Overview
The gemini-search model is now **hidden from the model menu** and **automatically activated** when a user sends a search query.

## How It Works

### 1. **Search Query Detection**
When a user sends a message, the system automatically detects if it's a search query using the `isSearchQuery()` function.

**Search Query Indicators:**
- Questions (contains `?`)
- Search keywords: "search", "find", "lookup", "what is", "who is", "when is", "where is", "how to", etc.
- News/current events: "news", "latest", "recent", "trending", "2024", "2025", etc.
- Information seeking: "tell me about", "explain", "information about", "details about", etc.
- Research: "research", "study", "article", "report", "statistics", etc.

**Examples of Search Queries:**
- "What is artificial intelligence?"
- "Find me the latest AI news"
- "Tell me about 2024 technology trends"
- "Search for recent developments in machine learning"
- "Who is Elon Musk?"
- "Latest news about OpenAI"

### 2. **Automatic Model Switching**
When a search query is detected:
1. The system **ignores the user's selected model**
2. **Automatically switches to gemini-search**
3. Sends the query to gemini-search with Google Search integration
4. Returns search results synthesized into the response

### 3. **User Experience**
- User selects any model from the menu (gemini, openai, mistral, etc.)
- User types a search query
- System automatically uses gemini-search
- User gets search results with current information
- For non-search queries, the selected model is used normally

## Implementation Details

### Files Modified

#### 1. `/src/lib/ai/pollinations.ts`
```typescript
// Hidden model for automatic search queries
export const SEARCH_MODEL = {
  provider: "pollinations",
  model: "gemini-search",
};

// gemini-search is created but not shown in menu
models["gemini-search"] = provider("gemini-search");
```

#### 2. `/src/lib/search-detector.ts` (NEW)
Contains the search query detection logic:
- `isSearchQuery(message: string)` - Detects if a message is a search query
- `extractSearchQuery(message: string)` - Extracts the search query text
- Comprehensive keyword and pattern matching

#### 3. `/src/lib/ai/models.ts`
```typescript
// Filter out gemini-search from the model menu
models: Object.entries(models)
  .filter(([name]) => name !== "gemini-search")
  .map(([name, model]) => ({...}))
```

#### 4. `/src/app/api/chat/route.ts`
```typescript
// Auto-detect search queries and use gemini-search model
let modelToUse = chatModel;
const messageText = message.parts
  ?.filter((part: any) => part?.type === "text")
  .map((part: any) => part?.text)
  .join(" ") || "";

if (isSearchQuery(messageText)) {
  modelToUse = SEARCH_MODEL;
  logger.info(`Search query detected, using gemini-search model`);
}

const model = customModelProvider.getModel(modelToUse);
```

## Model Menu

### Available Models (7 models shown)
1. **gemini** - Gemini 2.5 Flash Lite (vision)
2. **mistral** - Mistral Small 3.2 24B
3. **openai** - OpenAI GPT-5 Nano (vision)
4. **openai-fast** - OpenAI GPT-4.1 Nano (vision)
5. **openai-large** - OpenAI GPT-4.1 (vision)
6. **openai-reasoning** - OpenAI o4 Mini (reasoning + vision)
7. **roblox-rp** - Llama 3.1 8B

### Hidden Models (Auto-activated)
- **gemini-search** - Automatically used for search queries

## Search Query Examples

### ✅ Will Trigger Search Mode
```
"What is machine learning?"
"Find the latest AI news"
"Tell me about 2024 technology trends"
"Search for recent OpenAI announcements"
"Who is the CEO of Google?"
"When was ChatGPT released?"
"Where can I learn about AI?"
"How does deep learning work?"
"Latest news about artificial intelligence"
"Recent developments in quantum computing"
"Trending topics in tech"
"2024 AI breakthroughs"
```

### ❌ Will NOT Trigger Search Mode
```
"Explain how neural networks work"
"Write a Python function to calculate fibonacci"
"What's the difference between AI and ML?"
"Translate 'hello' to Spanish"
"Solve this math problem: 15 * 8 + 25"
```

## Benefits

1. **Seamless Search Experience** - Users don't need to manually switch models
2. **Always Current Information** - Search queries automatically get latest data
3. **Cleaner UI** - Model menu is less cluttered
4. **Smart Routing** - System intelligently routes queries to the right model
5. **Transparent** - Users can still see which model is being used in logs

## Testing

To test the auto-detection:

1. Open the chat interface
2. Select any model (e.g., "openai")
3. Send a search query like: "What are the latest AI developments in 2024?"
4. The system will automatically switch to gemini-search
5. Check the server logs to see: `Search query detected, using gemini-search model`
6. Observe the response includes current information with search context

## Future Enhancements

- Add UI indicator showing when search mode is active
- Allow users to disable auto-search detection
- Add search query suggestions
- Cache search results for common queries
- Add search result filtering options
