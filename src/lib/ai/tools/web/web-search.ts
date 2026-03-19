import { tool as createTool } from "ai";
import { z } from "zod";
import { safe } from "ts-safe";
import { load } from "cheerio";

// --- FreeWebSearch API Integration ---

export const freeSearchSchema = z.object({
  query: z
    .string()
    .describe(
      'Search query. Supports advanced operators like site:github.com, filetype:pdf, intitle:guide, or exact "phrases". Combine them for powerful searches.',
    ),
  numResults: z.coerce
    .number()
    .min(1)
    .max(100)
    .default(30)
    .describe("Number of search results to return (max 100)"),
});

// Fallback schema for content scraping
export const freeContentsSchema = z.object({
  urls: z
    .array(z.string())
    .describe("List of URLs to extract text content from"),
});

// --- Generic Search Interfaces (Exa Compatible) ---

export interface ExaSearchResult {
  id: string;
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text: string;
  image?: string;
  favicon?: string;
  score?: number;
}

export interface ExaSearchResponse {
  requestId: string;
  results: ExaSearchResult[];
}

export interface ExaSearchRequest {
  query: string;
  numResults?: number;
}

export interface ExaContentsRequest {
  urls: string[];
}

export const exaSearchSchema = freeSearchSchema;
export const exaContentsSchema = freeContentsSchema;

const getFaviconUrl = (url: string): string | undefined => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return undefined;
  }
};

async function fetchFreeSearch(
  query: string,
  numResults: number = 30,
): Promise<ExaSearchResponse> {
  const url = new URL("https://freewebsearch.onrender.com/api/search");
  url.searchParams.append("q", query);
  url.searchParams.append("n", numResults.toString());

  try {
    const searchResponse = await fetch(url.toString());

    if (!searchResponse.ok) {
      throw new Error(`Search API error: ${searchResponse.status}`);
    }

    const data = await searchResponse.json();

    const results: ExaSearchResult[] = (data.results || []).map(
      (result: any, index: number) => {
        const resultUrl = result.url || result.href || "";
        const favicon = getFaviconUrl(resultUrl);

        // Fallback to any provided thumbnail, otherwise undefined so UI hides broken icons
        const image = result.image || result.thumbnail;

        return {
          id: `result-${index}`,
          title: result.title || "No Title",
          url: resultUrl,
          text: result.body || result.snippet || "",
          favicon,
          image,
          score: 1,
        };
      },
    );

    return {
      requestId: data.query || query,
      results,
    };
  } catch (error) {
    console.error("Free Search Error:", error);
    throw error;
  }
}

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
  inputSchema: freeSearchSchema,
  execute: async (params) => {
    return fetchFreeSearch(params.query, params.numResults);
  },
});

export const exaContentsToolForWorkflow = createTool({
  description:
    "Extract raw text content from specific URLs. Only use this if you need to read the deep contents of a specific page returned by a search.",
  inputSchema: freeContentsSchema,
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
  inputSchema: freeSearchSchema,
  execute: (params) => {
    return safe(async () => {
      let queryStr = "";
      let numRes = 30;

      if (typeof params === "string") {
        queryStr = params;
      } else if (params && typeof params === "object") {
        queryStr = (params as any).query || "";
        numRes = (params as any).numResults || 30;
      }

      if (!queryStr) {
        throw new Error("Search query is missing or undefined.");
      }

      const result = await fetchFreeSearch(queryStr, numRes);

      const guide =
        result.results.length > 0
          ? `Use these search results to answer the user's question accurately. If you used advanced operators (like site:), mention that you filtered the search.`
          : `No search results were found for "${params.query}". 
             DANGER: Do NOT repeat the exact same search. 
             Instead: 
             1. Refine your query (use broader terms). 
             2. Use the 'steel-browser' tool if you need to find a specific page manually. 
             3. Explain to the user that direct search results are limited.`;

      return {
        ...result,
        guide,
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
  inputSchema: freeContentsSchema,
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
