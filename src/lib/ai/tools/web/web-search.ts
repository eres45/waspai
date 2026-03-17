import { tool as createTool } from "ai";
import { JSONSchema7 } from "json-schema";
import { jsonSchemaToZod } from "lib/json-schema-to-zod";
import { safe } from "ts-safe";
import { load } from "cheerio";

// --- FreeWebSearch API Integration ---

export const freeSearchSchema: JSONSchema7 = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description:
        'Search query. Supports advanced operators like site:github.com, filetype:pdf, intitle:guide, or exact "phrases". Combine them for powerful searches.',
    },
    numResults: {
      type: "number",
      description: "Number of search results to return (max 100)",
      default: 10,
      minimum: 1,
      maximum: 100,
    },
  },
  required: ["query"],
};

// Fallback schema for content scraping
export const freeContentsSchema: JSONSchema7 = {
  type: "object",
  properties: {
    urls: {
      type: "array",
      items: { type: "string" },
      description: "List of URLs to extract text content from",
    },
  },
  required: ["urls"],
};

const SEARCH_API_URL = "https://freewebsearch.onrender.com/api/search";

const fetchFreeSearch = async (query: string, numResults: number = 10) => {
  const url = new URL(SEARCH_API_URL);
  url.searchParams.append("q", query);
  url.searchParams.append("n", numResults.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `Search API error: ${response.status} ${response.statusText}`,
    );
  }

  return await response.json();
};

const scrapeWebpage = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const html = await response.text();
    const $ = load(html);

    // Remove scripts, styles, and empty elements
    $("script, style, noscript, iframe, img, svg").remove();

    // Get clean text
    const text = $("body").text().replace(/\\s+/g, " ").trim();
    return { url, text: text.substring(0, 8000) }; // Limit to avoid massive tokens
  } catch (error: any) {
    return { url, error: error.message };
  }
};

// Exporting with 'exa' names to maintain backwards compatibility with tool-kit.ts

export const exaSearchToolForWorkflow = createTool({
  description:
    'Free, fast, and comprehensive web search. Supports advanced operators: site:domain.com, filetype:pdf/ipynb, intitle:word, -exclude, and "exact phrase". Use this to find real-time information, news, code examples, or research papers.',
  inputSchema: jsonSchemaToZod(freeSearchSchema),
  execute: async (params) => {
    return fetchFreeSearch(params.query, params.numResults);
  },
});

export const exaContentsToolForWorkflow = createTool({
  description:
    "Extract raw text content from specific URLs. Only use this if you need to read the deep contents of a specific page returned by a search.",
  inputSchema: jsonSchemaToZod(freeContentsSchema),
  execute: async (params) => {
    const results = await Promise.all(
      params.urls.map((url) => scrapeWebpage(url)),
    );
    return { results };
  },
});

export const exaSearchTool = createTool({
  description:
    'Free, fast, and comprehensive web search. Supports advanced operators: site:domain.com, filetype:pdf/ipynb, intitle:word, -exclude, and "exact phrase". Use this to find real-time information, news, code examples, or research papers.',
  inputSchema: jsonSchemaToZod(freeSearchSchema),
  execute: (params) => {
    return safe(async () => {
      const result = await fetchFreeSearch(params.query, params.numResults);

      return {
        ...result,
        guide: `Use these search results to answer the user's question accurately. If you used advanced operators (like site:), mention that you filtered the search.`,
      };
    })
      .ifFail((e) => {
        return {
          isError: true,
          error: e.message,
          solution:
            "A web search error occurred. Explain the error to the user and answer based on your existing knowledge.",
        };
      })
      .unwrap();
  },
});

export const exaContentsTool = createTool({
  description:
    "Extract raw text content from specific URLs. Only use this if you need to read the deep contents of a specific page returned by a search.",
  inputSchema: jsonSchemaToZod(freeContentsSchema),
  execute: async (params) => {
    return safe(async () => {
      const results = await Promise.all(
        params.urls.map((url) => scrapeWebpage(url)),
      );
      return { results };
    })
      .ifFail((e) => {
        return {
          isError: true,
          error: e.message,
          solution:
            "A web content extraction error occurred. Explain the error to the user.",
        };
      })
      .unwrap();
  },
});
