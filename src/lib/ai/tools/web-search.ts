import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";

/**
 * Web Search Tool using SearchFlox AI
 * Performs live web searches and scrapes content from the internet
 * No API key required - uses public demo endpoint
 */
export const webSearchTool = createTool({
  name: "web-search",
  description:
    "Search the web for live information, news, and current data. Returns search results with sources and citations.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "The search query (e.g., 'latest AI news', 'TypeScript tutorial', 'weather in New York')",
      ),
    streaming: z
      .boolean()
      .optional()
      .describe(
        "Whether to use streaming for real-time results (default: false)",
      ),
  }),
  execute: async (
    { query, streaming = false },
    { abortSignal: _abortSignal },
  ) => {
    logger.info(`Web Search: Searching for "${query}"`);

    try {
      if (streaming) {
        return await performStreamingSearch(query);
      } else {
        return await performNonStreamingSearch(query);
      }
    } catch (error) {
      logger.error("Web Search Error:", error);
      throw new Error(
        `Failed to search the web: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});

/**
 * Non-streaming search - returns full results at once
 */
async function performNonStreamingSearch(query: string) {
  const searchUrl = "https://searchfloxai.vercel.app/api/search";

  logger.info(`Web Search: Performing non-streaming search for "${query}"`);

  const response = await fetch(searchUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error(`Web Search API error (${response.status}):`, error);

    if (response.status === 400) {
      throw new Error(
        "Invalid search query. Please provide a non-empty query.",
      );
    } else if (response.status === 429) {
      throw new Error("Rate limited. Please try again later.");
    } else if (response.status === 500) {
      throw new Error("SearchFlox API error. Please try again later.");
    }

    throw new Error(`SearchFlox API error: ${response.status}`);
  }

  const data = await response.json();

  logger.info(
    `Web Search: Found ${data.sources?.length || 0} sources for "${query}"`,
  );

  return {
    success: true,
    query: data.query,
    results: data.text,
    sources: data.sources || [],
    timestamp: data.timestamp,
    guide: `Search results for "${query}". Found ${data.sources?.length || 0} sources. Use the information above to answer the user's question.`,
  };
}

/**
 * Streaming search - returns results incrementally via Server-Sent Events
 */
async function performStreamingSearch(query: string) {
  const encodedQuery = encodeURIComponent(query);
  const streamUrl = `https://searchfloxai.vercel.app/api/search/stream?q=${encodedQuery}`;

  logger.info(`Web Search: Performing streaming search for "${query}"`);

  const response = await fetch(streamUrl);

  if (!response.ok) {
    logger.error(`Web Search streaming error (${response.status})`);

    if (response.status === 400) {
      throw new Error(
        "Invalid search query. Please provide a non-empty query.",
      );
    } else if (response.status === 429) {
      throw new Error("Rate limited. Please try again later.");
    } else if (response.status === 500) {
      throw new Error("SearchFlox API error. Please try again later.");
    }

    throw new Error(`SearchFlox API error: ${response.status}`);
  }

  // Parse SSE stream
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Failed to read streaming response");
  }

  const decoder = new TextDecoder();
  let fullText = "";
  const streamedChunks: string[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);

          if (data === "done") {
            logger.info(`Web Search: Streaming complete for "${query}"`);
            break;
          }

          try {
            const payload = JSON.parse(data);
            if (payload.type === "text") {
              fullText += payload.data;
              streamedChunks.push(payload.data);
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  logger.info(
    `Web Search: Streaming search complete. Received ${fullText.length} characters`,
  );

  return {
    success: true,
    query,
    results: fullText,
    streamedChunks,
    guide: `Streaming search results for "${query}". Use the information above to answer the user's question.`,
  };
}
