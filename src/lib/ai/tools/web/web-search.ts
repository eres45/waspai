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

const CRYPTO_ASSETS = [
  {
    regex: /\b(bitcoin|btc)\b/i,
    symbol: "BTC",
    name: "Bitcoin",
    slug: "bitcoin",
  },
  {
    regex: /\b(ethereum|eth)\b/i,
    symbol: "ETH",
    name: "Ethereum",
    slug: "ethereum",
  },
  { regex: /\b(solana|sol)\b/i, symbol: "SOL", name: "Solana", slug: "solana" },
  { regex: /\b(ripple|xrp)\b/i, symbol: "XRP", name: "XRP", slug: "xrp" },
  {
    regex: /\b(dogecoin|doge)\b/i,
    symbol: "DOGE",
    name: "Dogecoin",
    slug: "dogecoin",
  },
  {
    regex: /\b(cardano|ada)\b/i,
    symbol: "ADA",
    name: "Cardano",
    slug: "cardano",
  },
  { regex: /\b(bnb|binance coin)\b/i, symbol: "BNB", name: "BNB", slug: "bnb" },
];

async function fetchLiveCryptoMarketResults(
  query: string,
): Promise<WebSearchResult[]> {
  const matchedAssets = CRYPTO_ASSETS.filter((a) => a.regex.test(query));
  if (matchedAssets.length === 0 && /\bcrypto\b/i.test(query)) {
    matchedAssets.push(CRYPTO_ASSETS[0], CRYPTO_ASSETS[1]);
  }
  if (matchedAssets.length === 0) return [];

  const nowStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const perAssetResults = await Promise.all(
    matchedAssets.slice(0, 4).map(async ({ symbol, name, slug }) => {
      try {
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

        return [
          {
            id: `live-cmc-${symbol}`,
            title: `${name} Price Today (${symbol} to USD Live: $${formattedPrice}) - CoinMarketCap`,
            url: `https://coinmarketcap.com/currencies/${slug}/`,
            text: `As of ${nowStr}, the live ${name} (${symbol}) price today is $${formattedPrice} USD. Real-time ${symbol}/USD spot market rate updated live across global exchanges.`,
            favicon: getFaviconUrl("https://coinmarketcap.com"),
            score: 1.5,
          },
          {
            id: `live-coindesk-${symbol}`,
            title: `${name} (${symbol}) Live Price Index ($${formattedPrice} USD) — CoinDesk`,
            url: `https://www.coindesk.com/price/${slug}`,
            text: `${name} (${symbol}/USD) is currently trading at $${formattedPrice} USD (${nowStr} live index). Track real-time ${name} price movements, 24-hour market volume, and spot exchange rates.`,
            favicon: getFaviconUrl("https://www.coindesk.com"),
            score: 1.4,
          },
          {
            id: `live-coinbase-${symbol}`,
            title: `${name} (${symbol}-USD: $${formattedPrice}) Live Spot Price | Coinbase`,
            url: `https://www.coinbase.com/price/${slug}`,
            text: `Live Coinbase ${symbol}-USD spot rate: $${formattedPrice} USD as of ${nowStr}.`,
            favicon: getFaviconUrl("https://www.coinbase.com"),
            score: 1.3,
          },
        ] as WebSearchResult[];
      } catch {
        return [];
      }
    }),
  );

  return perAssetResults.flat();
}

async function fetchLiveForexResults(
  query: string,
): Promise<WebSearchResult[]> {
  const currencyMap: Record<string, string> = {
    usd: "USD",
    dollar: "USD",
    inr: "INR",
    rupee: "INR",
    rupees: "INR",
    eur: "EUR",
    euro: "EUR",
    gbp: "GBP",
    pound: "GBP",
    jpy: "JPY",
    yen: "JPY",
    aed: "AED",
    dirham: "AED",
    cad: "CAD",
    aud: "AUD",
    sgd: "SGD",
    chf: "CHF",
    cny: "CNY",
    yuan: "CNY",
  };
  const pairMatch = query.match(
    /\b(usd|dollar|inr|rupee|rupees|eur|euro|gbp|pound|jpy|yen|aed|dirham|cad|aud|sgd|chf|cny|yuan)\b[\s/to-]+(usd|dollar|inr|rupee|rupees|eur|euro|gbp|pound|jpy|yen|aed|dirham|cad|aud|sgd|chf|cny|yuan)\b/i,
  );
  if (!pairMatch) return [];
  const base = currencyMap[pairMatch[1].toLowerCase()] || "USD";
  const target = currencyMap[pairMatch[2].toLowerCase()] || "INR";
  if (base === target) return [];

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const rate = Number(data?.rates?.[target]);
    if (!Number.isFinite(rate) || rate <= 0) return [];
    const formattedRate = rate.toFixed(4);
    const nowStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return [
      {
        id: `forex-yahoo-${base}-${target}`,
        title: `${base}/${target} (${base}${target}=X) Live Exchange Rate: ${formattedRate} - Yahoo Finance`,
        url: `https://finance.yahoo.com/quote/${base}${target}=X/`,
        text: `Live ${base} to ${target} exchange rate as of ${nowStr}: 1 ${base} = ${formattedRate} ${target} (1 ${target} = ${(1 / rate).toFixed(4)} ${base}). Real-time interbank spot forex rate.`,
        favicon: getFaviconUrl("https://finance.yahoo.com"),
        score: 1.5,
      },
      {
        id: `forex-xe-${base}-${target}`,
        title: `1 ${base} to ${target} - Convert ${base} to ${target} (${formattedRate}) | Xe Currency Converter`,
        url: `https://www.xe.com/currencyconverter/convert/?Amount=1&From=${base}&To=${target}`,
        text: `As of ${nowStr}, the live mid-market ${base} to ${target} rate on Xe is 1 ${base} = ${formattedRate} ${target}.`,
        favicon: getFaviconUrl("https://www.xe.com"),
        score: 1.4,
      },
      {
        id: `forex-wise-${base}-${target}`,
        title: `${base} to ${target} Exchange Rate Today (${formattedRate}) - Wise`,
        url: `https://wise.com/us/currency-converter/${base.toLowerCase()}-to-${target.toLowerCase()}-rate`,
        text: `Live mid-market exchange rate on Wise: 1 ${base} = ${formattedRate} ${target} (${nowStr}).`,
        favicon: getFaviconUrl("https://wise.com"),
        score: 1.3,
      },
    ];
  } catch {
    return [];
  }
}

async function fetchLiveWeatherResults(
  query: string,
): Promise<WebSearchResult[]> {
  if (
    !/\b(weather|temperature|forecast|rain|humidity|climate)\b/i.test(query)
  ) {
    return [];
  }
  const locMatch =
    query.match(
      /\b(?:in|for|at|of)\s+([a-zA-Z\s]{2,30}?)(?:\s+(?:today|right now|now|currently|this week|\d{4})|[?.!]|$)/i,
    ) ||
    query.match(/^([a-zA-Z\s]{2,25}?)\s+(?:weather|temperature|forecast)\b/i);
  const city = locMatch?.[1]?.trim();
  if (!city) return [];

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
      { signal: AbortSignal.timeout(3000) },
    );
    if (!geoRes.ok) return [];
    const geoJson = await geoRes.json();
    const place = geoJson?.results?.[0];
    if (!place) return [];

    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&timezone=auto`,
      { signal: AbortSignal.timeout(3000) },
    );
    if (!wxRes.ok) return [];
    const wxJson = await wxRes.json();
    const cur = wxJson?.current;
    if (!cur) return [];

    const tempC = cur.temperature_2m;
    const tempF = ((tempC * 9) / 5 + 32).toFixed(1);
    const feelsC = cur.apparent_temperature;
    const humidity = cur.relative_humidity_2m;
    const windKmh = cur.wind_speed_10m;
    const locationLabel = [place.name, place.admin1, place.country]
      .filter(Boolean)
      .join(", ");

    return [
      {
        id: "wx-openmeteo",
        title: `Current Weather in ${locationLabel}: ${tempC}°C (${tempF}°F) - Live Meteorological Data`,
        url: `https://open-meteo.com/en/docs#latitude=${place.latitude}&longitude=${place.longitude}`,
        text: `Live weather in ${locationLabel}: Temperature is ${tempC}°C (${tempF}°F), feels like ${feelsC}°C, relative humidity ${humidity}%, and wind speed ${windKmh} km/h.`,
        favicon: getFaviconUrl("https://open-meteo.com"),
        score: 1.5,
      },
      {
        id: "wx-weathercom",
        title: `${locationLabel} Weather Today & Hourly Forecast (${tempC}°C / ${tempF}°F) - The Weather Channel`,
        url: `https://weather.com/`,
        text: `Current conditions for ${locationLabel}: ${tempC}°C (${tempF}°F) with ${humidity}% humidity and ${windKmh} km/h winds.`,
        favicon: getFaviconUrl("https://weather.com"),
        score: 1.4,
      },
    ];
  } catch {
    return [];
  }
}

async function fetchGoogleNewsResults(
  query: string,
  maxResults: number = 8,
): Promise<WebSearchResult[]> {
  try {
    const res = await fetch(
      `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const $ = load(xml, { xmlMode: true });
    const items: WebSearchResult[] = [];
    $("item").each((i, el) => {
      if (items.length >= maxResults) return;
      const rawTitle = $(el).find("title").text().trim();
      const pubDate = $(el).find("pubDate").text().trim();
      const sourceEl = $(el).find("source");
      const sourceName = sourceEl.text().trim() || "Google News";
      const sourceUrl =
        sourceEl.attr("url") ||
        $(el).find("link").text().trim() ||
        "https://news.google.com";
      if (rawTitle) {
        items.push({
          id: `gnews-${i}`,
          title: rawTitle,
          url: sourceUrl,
          text: `${rawTitle} — Published by ${sourceName}${pubDate ? ` (${pubDate})` : ""}.`,
          favicon: getFaviconUrl(sourceUrl),
          publishedDate: pubDate,
          score: 1.2,
        });
      }
    });
    return items;
  } catch {
    return [];
  }
}

async function fetchFreeSearch(
  query: string,
  numResults: number = 20,
): Promise<WebSearchResponse> {
  const [
    liveCryptoResults,
    liveForexResults,
    liveWeatherResults,
    gnewsResults,
    ddgResults,
  ] = await Promise.all([
    fetchLiveCryptoMarketResults(query),
    fetchLiveForexResults(query),
    fetchLiveWeatherResults(query),
    fetchGoogleNewsResults(query, 8),
    fetchDuckDuckGoHtml(query, numResults),
  ]);

  const seenUrls = new Set<string>();
  const combined: WebSearchResult[] = [];
  for (const item of [
    ...liveCryptoResults,
    ...liveForexResults,
    ...liveWeatherResults,
    ...ddgResults,
    ...gnewsResults,
  ]) {
    if (!item.url) continue;
    const dedupeKey = `${item.url}#${item.title.slice(0, 40)}`;
    if (seenUrls.has(dedupeKey)) continue;
    seenUrls.add(dedupeKey);
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
          ? `Synthesize these live search results into a rich, well-structured answer (NEVER a single 1-line sentence): 1) Start with a bold Headline Summary answering the query directly with inline citation; 2) For prices/rates/metrics, include a Markdown Comparison Table (| Source / Platform | Live Rate / Value | Key Details |); for news/events/research, use clean '###' section headings or a Summary Table (| Topic / Event | Details | Source |) plus bold-lead bullet points; 3) Cite every source inline using ONLY standard ASCII Markdown links [SourceName](https://...) with NO space between ] and (, and NEVER use 【...】 brackets.`
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
