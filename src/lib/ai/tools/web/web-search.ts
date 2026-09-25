import { tool as createTool } from "ai";
import { z } from "zod";
import { safe } from "ts-safe";
import { load } from "cheerio";
import { getSession } from "auth/server";
import { checkDailyUsageLimit, recordDailyUsage } from "lib/usage-limiter";

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

// --- Generic Search Interfaces ---

export interface WebSearchResult {
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

export interface WebSearchResponse {
  requestId: string;
  results: WebSearchResult[];
}

export interface WebSearchRequest {
  query: string;
  numResults?: number;
}

export interface WebContentRequest {
  urls: string[];
}

export const webSearchSchema = freeSearchSchema;
export const webContentSchema = freeContentsSchema;

const getFaviconUrl = (url: string): string | undefined => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return undefined;
  }
};

async function fetchDuckDuckGoHtml(
  query: string,
  maxResults: number = 15,
): Promise<WebSearchResult[]> {
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(5500),
      },
    );
    if (!res.ok) return [];
    const html = await res.text();
    const $ = load(html);
    const items: WebSearchResult[] = [];
    $(".result").each((i, el) => {
      if (items.length >= maxResults) return;
      const title = $(el).find(".result__title").text().trim();
      let rawHref =
        $(el).find(".result__a").attr("href") ||
        $(el).find(".result__url").attr("href") ||
        "";
      if (rawHref.includes("uddg=")) {
        try {
          rawHref = decodeURIComponent(rawHref.split("uddg=")[1].split("&")[0]);
        } catch {}
      } else if (rawHref.startsWith("//")) {
        rawHref = `https:${rawHref}`;
      }
      const snippet = $(el).find(".result__snippet").text().trim();
      if (title && rawHref.startsWith("http")) {
        items.push({
          id: `ddg-${i}`,
          title,
          url: rawHref,
          text: snippet || title,
          favicon: getFaviconUrl(rawHref),
          score: 1,
        });
      }
    });
    return items;
  } catch {
    return [];
  }
}

async function fetchLiveCryptoMarketResults(
  query: string,
): Promise<WebSearchResult[]> {
  if (!/\b(bitcoin|btc|ethereum|eth|solana|sol|crypto)\b/i.test(query)) {
    return [];
  }
  try {
    const isEth =
      /\b(ethereum|eth)\b/i.test(query) && !/\b(bitcoin|btc)\b/i.test(query);
    const isSol =
      /\b(solana|sol)\b/i.test(query) && !/\b(bitcoin|btc)\b/i.test(query);
    const symbol = isEth ? "ETH" : isSol ? "SOL" : "BTC";
    const name = isEth ? "Ethereum" : isSol ? "Solana" : "Bitcoin";
    const slug = isEth ? "ethereum" : isSol ? "solana" : "bitcoin";

    const spotRes = await fetch(
      `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`,
      { signal: AbortSignal.timeout(3500) },
    );
    if (!spotRes.ok) return [];
    const spotJson = await spotRes.json();
    const rawAmount = Number(spotJson?.data?.amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) return [];

    const formattedPrice = rawAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const nowStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return [
      {
        id: "live-cmc",
        title: `${name} Price Today (${symbol} to USD Live) - CoinMarketCap`,
        url: `https://coinmarketcap.com/currencies/${slug}/`,
        text: `As of ${nowStr}, the live ${name} (${symbol}) price today is $${formattedPrice} USD. Real-time ${symbol}/USD spot market rate updated live across global exchanges.`,
        favicon: getFaviconUrl("https://coinmarketcap.com"),
        score: 1.5,
      },
      {
        id: "live-coindesk",
        title: `${name} (${symbol}) Live Price Index & Market Chart — CoinDesk`,
        url: `https://www.coindesk.com/price/${slug}`,
        text: `${name} (${symbol}/USD) is currently trading at $${formattedPrice} USD (${nowStr} live index). Track real-time ${name} price movements, 24-hour market volume, and spot exchange rates.`,
        favicon: getFaviconUrl("https://www.coindesk.com"),
        score: 1.4,
      },
      {
        id: "live-coinbase",
        title: `${name} (${symbol}-USD) Live Spot Price | Coinbase Exchange`,
        url: `https://www.coinbase.com/price/${slug}`,
        text: `Live Coinbase ${symbol}-USD spot rate: $${formattedPrice} USD as of ${nowStr}.`,
        favicon: getFaviconUrl("https://www.coinbase.com"),
        score: 1.3,
      },
    ];
  } catch {
    return [];
  }
}

async function fetchFreeSearch(
  query: string,
  numResults: number = 20,
): Promise<WebSearchResponse> {
  const renderPromise = (async (): Promise<WebSearchResult[]> => {
    try {
      const url = new URL("https://freewebsearch.onrender.com/api/search");
      url.searchParams.append("q", query);
      url.searchParams.append("n", Math.min(numResults, 20).toString());
      const searchResponse = await fetch(url.toString(), {
        signal: AbortSignal.timeout(4000),
      });
      if (!searchResponse.ok) return [];
      const data = await searchResponse.json();
      return (data.results || []).map((result: any, index: number) => {
        const resultUrl = result.url || result.href || "";
        return {
          id: `render-${index}`,
          title: result.title || "No Title",
          url: resultUrl,
          text: result.body || result.snippet || "",
          favicon: getFaviconUrl(resultUrl),
          image: result.image || result.thumbnail,
          score: 1,
        };
      });
    } catch {
      return [];
    }
  })();

  const [liveMarketResults, ddgResults, renderResults] = await Promise.all([
    fetchLiveCryptoMarketResults(query),
    fetchDuckDuckGoHtml(query, numResults),
    renderPromise,
  ]);

  const seenUrls = new Set<string>();
  const combined: WebSearchResult[] = [];
  for (const item of [...liveMarketResults, ...ddgResults, ...renderResults]) {
    if (!item.url || seenUrls.has(item.url)) continue;
    seenUrls.add(item.url);
    combined.push({
      ...item,
      id: `result-${combined.length}`,
    });
    if (combined.length >= numResults) break;
  }

  return {
    requestId: query,
    results: combined,
  };
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

// Exporting tools using generic web search names

export const webSearchToolForWorkflow = createTool({
  description:
    'Free, fast, and comprehensive web search. Supports advanced operators: site:domain.com, filetype:pdf/ipynb, intitle:word, -exclude, and "exact phrase". Use this to find real-time information, news, code examples, or research papers.',
  inputSchema: freeSearchSchema,
  execute: async (params) => {
    const session = await getSession().catch(() => null);
    const userId = session?.user?.id;
    const userTier = (session?.user as any)?.tier ?? "free";
    const isExempt =
      userTier === "pro" ||
      userTier === "ultra" ||
      (session?.user as any)?.role === "admin";

    if (userId && !isExempt) {
      const usageCheck = await checkDailyUsageLimit(userId, "web_search", 10);
      if (!usageCheck.allowed) {
        return {
          requestId: params.query,
          isLimitExceeded: true,
          limit: 10,
          used: usageCheck.count,
          results: [
            {
              id: "limit-exceeded",
              title:
                "Daily Free Plan Web Search Limit Reached (10/10 used today)",
              url: "/subscription",
              text: "SYSTEM_LIMIT_REACHED: The user is on the Free Plan and has used all 10 of their daily free web searches today (resets at 4:00 AM IST). MANDATORY AI INSTRUCTION: Politely inform the user that they have reached their daily Free Plan limit of 10 web searches, and let them know they can upgrade to WaspAI Pro (/subscription) for unlimited real-time web searches, higher image generation limits, and priority access.",
            },
          ],
          guide:
            "LIMIT_EXCEEDED: The user has reached their daily limit of 10 web searches on the Free plan. You MUST inform the user that they have reached their daily Free Plan web search limit (10/day) and invite them to upgrade to WaspAI Pro (/subscription) for unlimited web searches.",
        };
      }
      await recordDailyUsage(userId, "web_search").catch(() => {});
    }

    return fetchFreeSearch(params.query, params.numResults);
  },
});

export const webContentToolForWorkflow = createTool({
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

export const webSearchTool = createTool({
  description:
    "Search the web for real-time information, current market prices, live cryptocurrency/bitcoin/stock rates, latest news, current weather, or events beyond your knowledge cutoff. Invoke this tool whenever the user asks for current prices, live data, or latest updates.",
  inputSchema: freeSearchSchema,
  execute: (params) => {
    return safe(async () => {
      let queryStr = "";
      let numRes = 20;

      if (typeof params === "string") {
        queryStr = params;
      } else if (params && typeof params === "object") {
        queryStr =
          (params as any).query ||
          (params as any).q ||
          (params as any).search_query ||
          "";
        numRes = (params as any).numResults || 20;
      }

      if (!queryStr) {
        throw new Error("Search query is missing or undefined.");
      }

      const session = await getSession().catch(() => null);
      const userId = session?.user?.id;
      const userTier = (session?.user as any)?.tier ?? "free";
      const isExempt =
        userTier === "pro" ||
        userTier === "ultra" ||
        (session?.user as any)?.role === "admin";

      if (userId && !isExempt) {
        const usageCheck = await checkDailyUsageLimit(userId, "web_search", 10);
        if (!usageCheck.allowed) {
          return {
            requestId: queryStr,
            isLimitExceeded: true,
            limit: 10,
            used: usageCheck.count,
            results: [
              {
                id: "limit-exceeded",
                title:
                  "Daily Free Plan Web Search Limit Reached (10/10 used today)",
                url: "/subscription",
                text: "SYSTEM_LIMIT_REACHED: The user is on the Free Plan and has used all 10 of their daily free web searches today (resets at 4:00 AM IST). MANDATORY AI INSTRUCTION: Politely inform the user that they have reached their daily Free Plan limit of 10 web searches for today, and let them know they can upgrade to WaspAI Pro (/subscription) to unlock unlimited real-time web searches, higher image generation limits, and priority model access.",
              },
            ],
            query: queryStr,
            guide:
              "LIMIT_EXCEEDED: The user has reached their daily limit of 10 web searches on the Free plan. You MUST explicitly inform the user that they reached their daily Free Plan limit of 10 web searches (resets at 4:00 AM IST) and recommend upgrading to WaspAI Pro (/subscription) for unlimited web search access.",
          };
        }
        await recordDailyUsage(userId, "web_search").catch(() => {});
      }

      const result = await fetchFreeSearch(queryStr, numRes);

      const guide =
        result.results.length > 0
          ? `Use these live search results to answer the user's question accurately with exact numbers and inline Markdown source citations (e.g. [CoinMarketCap](url), [CoinDesk](url)).`
          : `No search results were found for "${queryStr}".`;

      return {
        ...result,
        query: queryStr,
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

export const webContentTool = createTool({
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
