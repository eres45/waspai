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
  numResults: number = 10,
): Promise<ExaSearchResponse> {
  const url = new URL("https://freewebsearch.onrender.com/api/search");
  url.searchParams.append("q", query);
  url.searchParams.append("n", numResults.toString());

  try {
    // Parallel fetch for images if it's a "standard" search
    const [searchResponse, imagesResponse] = await Promise.all([
      fetch(url.toString()),
      fetch(
        `https://freewebsearch.onrender.com/api/search?q=${encodeURIComponent(
          query,
        )}&type=image&n=6`,
      ).catch(() => null),
    ]);

    if (!searchResponse.ok) {
      throw new Error(`Search API error: ${searchResponse.status}`);
    }

    const data = await searchResponse.json();
    const imageData = imagesResponse?.ok ? await imagesResponse.json() : null;

    // Extract images from image search results
    const foundImages =
      imageData?.results?.map((r: any) => ({
        url: r.url || r.href,
        title: r.title,
      })) || [];

    const results: ExaSearchResult[] = (data.results || []).map(
      (result: any, index: number) => {
        const resultUrl = result.url || result.href || "";
        const favicon = getFaviconUrl(resultUrl);

        // Inject images into the first few results for the UI grid
        const image =
          foundImages[index]?.url || result.image || result.thumbnail;

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
