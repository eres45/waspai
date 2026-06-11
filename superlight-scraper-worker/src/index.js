/**
 * SuperLight Scraper — Cloudflare Worker
 *
 * Routes:
 *   GET  /scrape?url=<URL>&format=json|markdown&ttl=300&selector=<css>
 *   GET  /links?url=<URL>
 *   GET  /sitemap?url=<URL>
 *   GET  /feed?url=<URL>
 *   POST /batch  — body: { urls: string[], format?: string, ttl?: number }
 */

import { extractJsonLd } from "./extractors/jsonld.js";
import { extractOpenGraph } from "./extractors/opengraph.js";
import { fetchViaJina } from "./utils/jina.js";
import { getCache, setCache } from "./utils/cache.js";
import { fetchWithTimeout } from "./utils/fetcher.js";
import { extractLinks } from "./extractors/links.js";
import { detectFeedUrls, fetchAndParseFeed } from "./extractors/rss.js";
import { fetchRobots, parseSitemap } from "./extractors/sitemap.js";

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    try {
      // ── Route dispatch ────────────────────────────────────────────────────
      if (url.pathname === "/scrape" && request.method === "GET") {
        return await handleScrape(url, env, ctx);
      }
      if (url.pathname === "/links" && request.method === "GET") {
        return await handleLinks(url, env);
      }
      if (url.pathname === "/sitemap" && request.method === "GET") {
        return await handleSitemap(url, env);
      }
      if (url.pathname === "/feed" && request.method === "GET") {
        return await handleFeed(url, env);
      }
      if (url.pathname === "/batch" && request.method === "POST") {
        return await handleBatch(request, env);
      }

      // Root — show API info
      if (url.pathname === "/" || url.pathname === "") {
        return jsonResponse({
          name: "SuperLight Scraper",
          version: "2.0.0",
          endpoints: {
            "GET /scrape": "Scrape a URL — returns structured JSON or markdown",
            "GET /links": "Extract all hyperlinks from a page",
            "GET /sitemap": "Discover and parse a site's sitemap.xml",
            "GET /feed": "Auto-detect and parse RSS/Atom feeds",
            "POST /batch": "Scrape up to 10 URLs in parallel",
          },
          params: {
            url: "Required — target URL (http/https)",
            format: "Optional — json (default) or markdown",
            ttl: "Optional — cache TTL in seconds (default 300)",
            selector:
              "Optional (/scrape only) — CSS selector to extract specific element",
          },
          source: "https://superlight-scraper.rutv.workers.dev",
        });
      }

      return jsonResponse({ error: "Not found" }, 404);
    } catch (e) {
      console.error("Unhandled error:", e);
      return jsonResponse(
        { error: "Internal server error", detail: e.message },
        500,
      );
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// /scrape — Main scraping endpoint
// ─────────────────────────────────────────────────────────────────────────────

async function handleScrape(url, env, ctx) {
  const targetUrl = url.searchParams.get("url");
  if (!targetUrl)
    return jsonResponse({ error: "Missing ?url= parameter" }, 400);

  const parsed = validateUrl(targetUrl);
  if (!parsed)
    return jsonResponse(
      { error: "Invalid URL — must be http:// or https://" },
      400,
    );

  const format = url.searchParams.get("format") || "json";
  const selector = url.searchParams.get("selector") || null;
  const cacheTtl = Math.max(60, parseInt(url.searchParams.get("ttl")) || 300);
  const cacheKey = `v2:scrape:${format}:${selector || ""}:${targetUrl}`;

  // KV Cache check
  const cached = await getCache(env.SCRAPE_CACHE, cacheKey).catch(() => null);
  if (cached) {
    const data = JSON.parse(cached);
    data._cached = true;
    if (format === "markdown" && data.markdown) {
      return new Response(data.markdown, {
        headers: {
          "Content-Type": "text/markdown",
          "Access-Control-Allow-Origin": "*",
          "X-Cache": "HIT",
        },
      });
    }
    return jsonResponse(data, 200, { "X-Cache": "HIT" });
  }

  const result = await scrapeOne(targetUrl, { selector, env });

  if (!result.error) {
    ctx.waitUntil(
      setCache(
        env.SCRAPE_CACHE,
        cacheKey,
        JSON.stringify(result),
        cacheTtl,
      ).catch(() => {}),
    );
  }

  if (result.error) return jsonResponse(result, 422);

  // Markdown format response
  if (format === "markdown" && result.markdown) {
    return new Response(result.markdown, {
      headers: {
        "Content-Type": "text/markdown",
        "X-Source": result._source,
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return jsonResponse(result, 200, { "X-Source": result._source });
}

// ─────────────────────────────────────────────────────────────────────────────
// /links — Extract all hyperlinks from a page
// ─────────────────────────────────────────────────────────────────────────────

async function handleLinks(url, env) {
  const targetUrl = url.searchParams.get("url");
  if (!targetUrl)
    return jsonResponse({ error: "Missing ?url= parameter" }, 400);
  if (!validateUrl(targetUrl))
    return jsonResponse({ error: "Invalid URL" }, 400);

  const cacheKey = `v2:links:${targetUrl}`;
  const cached = await getCache(env.SCRAPE_CACHE, cacheKey).catch(() => null);
  if (cached) {
    const data = JSON.parse(cached);
    data._cached = true;
    return jsonResponse(data, 200, { "X-Cache": "HIT" });
  }

  try {
    const resp = await fetchWithTimeout(targetUrl, { timeout: 8000 });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const links = await extractLinks(resp, targetUrl);
    const internal = links.filter((l) => l.type === "internal");
    const external = links.filter((l) => l.type === "external");

    const result = {
      url: targetUrl,
      total: links.length,
      internal: internal.length,
      external: external.length,
      links,
      _timestamp: Date.now(),
    };

    await setCache(
      env.SCRAPE_CACHE,
      cacheKey,
      JSON.stringify(result),
      300,
    ).catch(() => {});
    return jsonResponse(result);
  } catch (e) {
    return jsonResponse({ error: e.message, url: targetUrl }, 422);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// /sitemap — Discover and parse sitemap.xml
// ─────────────────────────────────────────────────────────────────────────────

async function handleSitemap(url, env) {
  const targetUrl = url.searchParams.get("url");
  if (!targetUrl)
    return jsonResponse({ error: "Missing ?url= parameter" }, 400);

  const parsed = validateUrl(targetUrl);
  if (!parsed) return jsonResponse({ error: "Invalid URL" }, 400);

  const origin = parsed.origin;
  const cacheKey = `v2:sitemap:${origin}`;
  const cached = await getCache(env.SCRAPE_CACHE, cacheKey).catch(() => null);
  if (cached) {
    const data = JSON.parse(cached);
    data._cached = true;
    return jsonResponse(data, 200, { "X-Cache": "HIT" });
  }

  try {
    const robots = await fetchRobots(targetUrl);

    // Try sitemaps from robots.txt, then common defaults
    const sitemapCandidates =
      robots.sitemaps.length > 0
        ? robots.sitemaps
        : [
            `${origin}/sitemap.xml`,
            `${origin}/sitemap_index.xml`,
            `${origin}/sitemap/sitemap.xml`,
          ];

    let sitemapData = null;
    let _usedUrl = null;
    for (const su of sitemapCandidates) {
      try {
        sitemapData = await parseSitemap(su);
        _usedUrl = su;
        break;
      } catch {}
    }

    if (!sitemapData) {
      return jsonResponse(
        {
          error: "No sitemap found",
          url: targetUrl,
          origin,
          robotsSitemaps: robots.sitemaps,
          triedUrls: sitemapCandidates,
        },
        404,
      );
    }

    const result = {
      url: targetUrl,
      origin,
      robotsSitemaps: robots.sitemaps,
      ...sitemapData,
      _timestamp: Date.now(),
    };

    await setCache(
      env.SCRAPE_CACHE,
      cacheKey,
      JSON.stringify(result),
      3600,
    ).catch(() => {});
    return jsonResponse(result);
  } catch (e) {
    return jsonResponse({ error: e.message, url: targetUrl }, 422);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// /feed — Auto-detect and parse RSS/Atom feed
// ─────────────────────────────────────────────────────────────────────────────

async function handleFeed(url, env) {
  const targetUrl = url.searchParams.get("url");
  if (!targetUrl)
    return jsonResponse({ error: "Missing ?url= parameter" }, 400);
  if (!validateUrl(targetUrl))
    return jsonResponse({ error: "Invalid URL" }, 400);

  const cacheKey = `v2:feed:${targetUrl}`;
  const cached = await getCache(env.SCRAPE_CACHE, cacheKey).catch(() => null);
  if (cached) {
    const data = JSON.parse(cached);
    data._cached = true;
    return jsonResponse(data, 200, { "X-Cache": "HIT" });
  }

  try {
    // Fetch HTML to discover feed links
    const resp = await fetchWithTimeout(targetUrl, { timeout: 8000 });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();

    const feeds = detectFeedUrls(html, targetUrl);

    if (feeds.length === 0) {
      // Try common feed paths
      const common = ["/feed", "/rss", "/feed.xml", "/rss.xml", "/atom.xml"];
      const origin = new URL(targetUrl).origin;
      for (const path of common) {
        try {
          const feedData = await fetchAndParseFeed(`${origin}${path}`);
          feedData._discovered = "common-path";
          feedData._timestamp = Date.now();
          await setCache(
            env.SCRAPE_CACHE,
            cacheKey,
            JSON.stringify(feedData),
            600,
          ).catch(() => {});
          return jsonResponse(feedData);
        } catch {}
      }
      return jsonResponse(
        { error: "No RSS/Atom feed found on this page", url: targetUrl },
        404,
      );
    }

    // Parse the first detected feed
    const feedData = await fetchAndParseFeed(feeds[0].url);
    const result = {
      ...feedData,
      allFeeds: feeds,
      _discovered: "html-link-tag",
      _timestamp: Date.now(),
    };

    await setCache(
      env.SCRAPE_CACHE,
      cacheKey,
      JSON.stringify(result),
      600,
    ).catch(() => {});
    return jsonResponse(result);
  } catch (e) {
    return jsonResponse({ error: e.message, url: targetUrl }, 422);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// /batch — Scrape up to 10 URLs in parallel
// ─────────────────────────────────────────────────────────────────────────────

async function handleBatch(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { urls } = body;

  if (!Array.isArray(urls) || urls.length === 0) {
    return jsonResponse(
      { error: 'Body must include a non-empty "urls" array' },
      400,
    );
  }
  if (urls.length > 10) {
    return jsonResponse({ error: "Maximum 10 URLs per batch request" }, 400);
  }

  const start = Date.now();
  const settled = await Promise.allSettled(
    urls.map((url) => scrapeOne(url, { env })),
  );

  const results = settled.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : {
          url: urls[i],
          error: r.reason?.message || "Unknown error",
          _source: "error",
        },
  );

  return jsonResponse({
    total: urls.length,
    successful: results.filter((r) => !r.error).length,
    failed: results.filter((r) => r.error).length,
    elapsed: Date.now() - start,
    results,
    _timestamp: Date.now(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Core scrape logic — shared by /scrape and /batch
// ─────────────────────────────────────────────────────────────────────────────

async function scrapeOne(targetUrl, { selector = null, env }) {
  // Validate URL
  const parsed = validateUrl(targetUrl);
  if (!parsed) {
    return { url: targetUrl, error: "Invalid URL" };
  }

  // ── 1. Selector-targeted extraction ──────────────────────────────────────
  if (selector) {
    try {
      const resp = await fetchWithTimeout(targetUrl, { timeout: 8000 });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      // Clone for two simultaneous passes
      const respForSelector = resp.clone();
      const html = await resp.text();
      const og = extractOpenGraph(html);
      const jsonLd = extractJsonLd(html);
      const feeds = detectFeedUrls(html, targetUrl);

      let selectedText = "";
      const rewriter = new HTMLRewriter().on(selector, {
        text(chunk) {
          selectedText += chunk.text;
        },
      });
      await rewriter.transform(respForSelector).arrayBuffer();

      return {
        url: targetUrl,
        selector,
        title: og.title || jsonLd[0]?.name || jsonLd[0]?.headline || null,
        text: selectedText.trim() || null,
        feeds: feeds.length > 0 ? feeds : undefined,
        openGraph: og,
        _source: "selector-extraction",
        _timestamp: Date.now(),
      };
    } catch (e) {
      return { url: targetUrl, selector, error: e.message };
    }
  }

  let result = null;
  let _source = "unknown";

  // ── 2. Smart extraction — JSON-LD + OpenGraph ─────────────────────────────
  try {
    const resp = await fetchWithTimeout(targetUrl, { timeout: 8000 });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const html = await resp.text();
    const jsonLd = extractJsonLd(html);
    const og = extractOpenGraph(html);
    const feeds = detectFeedUrls(html, targetUrl); // auto-detect feeds

    if (jsonLd.length > 0 || og.title) {
      result = {
        url: targetUrl,
        title: og.title || jsonLd[0]?.name || jsonLd[0]?.headline || null,
        description: og.description || jsonLd[0]?.description || null,
        image: og.image || jsonLd[0]?.image?.url || jsonLd[0]?.image || null,
        type: jsonLd[0]?.["@type"] || og.type || "website",
        jsonLd,
        openGraph: og,
        feeds: feeds.length > 0 ? feeds : undefined,
        text: null,
        markdown: null,
        _source: "smart-extraction",
        _timestamp: Date.now(),
      };
      _source = "smart";
    }
  } catch (e) {
    console.log("Smart extraction failed:", e.message);
  }

  // ── 3. Jina AI Reader fallback ────────────────────────────────────────────
  if (!result && env.JINA_ENABLED !== "false") {
    try {
      const jinaData = await fetchViaJina(targetUrl, env.JINA_API_KEY || null);
      if (jinaData) {
        result = {
          url: targetUrl,
          title: jinaData.title || null,
          description: null,
          image: null,
          type: "article",
          jsonLd: [],
          openGraph: {},
          text: jinaData.text || null,
          markdown: jinaData.markdown || null,
          _source: "jina-ai",
          _timestamp: Date.now(),
        };
        _source = "jina";
      }
    } catch (e) {
      console.log("Jina fallback failed:", e.message);
    }
  }

  // ── 4. HTMLRewriter fallback ──────────────────────────────────────────────
  if (!result) {
    try {
      const resp = await fetchWithTimeout(targetUrl, { timeout: 8000 });
      if (resp.ok) {
        let title = "";
        let text = "";
        let description = "";
        let image = "";

        const rewriter = new HTMLRewriter()
          .on("title", {
            text(chunk) {
              title += chunk.text;
            },
          })
          .on('meta[name="description"]', {
            element(e) {
              description = e.getAttribute("content") || "";
            },
          })
          .on('meta[property="og:image"]', {
            element(e) {
              image = e.getAttribute("content") || "";
            },
          })
          .on('article, [role="main"], .content, .post, .entry', {
            text(chunk) {
              text += chunk.text + " ";
            },
          })
          .on("h1, h2, h3, p", {
            text(chunk) {
              text += chunk.text + " ";
            },
          });

        await rewriter.transform(resp).arrayBuffer();

        result = {
          url: targetUrl,
          title: title.trim() || null,
          description: description || null,
          image: image || null,
          type: "website",
          jsonLd: [],
          openGraph: {},
          text: text.trim().slice(0, 10000) || null,
          markdown: null,
          _source: "htmlrewriter",
          _timestamp: Date.now(),
        };
        _source = "htmlrewriter";
      }
    } catch (e) {
      console.log("HTMLRewriter failed:", e.message);
    }
  }

  // ── 5. Browser Rendering API (paid, opt-in) ───────────────────────────────
  if (!result && env.BROWSER_API_ENABLED === "true" && env.BROWSER_API_TOKEN) {
    try {
      const browserResp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/content`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.BROWSER_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: targetUrl }),
        },
      );
      if (browserResp.ok) {
        const html = await browserResp.text();
        const jsonLd = extractJsonLd(html);
        const og = extractOpenGraph(html);
        result = {
          url: targetUrl,
          title: og.title || jsonLd[0]?.name || null,
          description: og.description || null,
          image: og.image || null,
          type: "website",
          jsonLd,
          openGraph: og,
          text: html.slice(0, 5000),
          markdown: null,
          _source: "browser-rendering",
          _timestamp: Date.now(),
        };
        _source = "browser";
      }
    } catch (e) {
      console.log("Browser fallback failed:", e.message);
    }
  }

  if (!result) {
    return {
      url: targetUrl,
      error:
        "Unable to scrape this URL. It may require JavaScript execution or anti-bot protection.",
    };
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function validateUrl(raw) {
  try {
    const u = new URL(raw);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    return u;
  } catch {
    return null;
  }
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      ...extraHeaders,
    },
  });
}
