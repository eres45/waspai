import { tool as createTool } from "ai";
import { z } from "zod";
import { safe } from "ts-safe";

/**
 * SuperLight Scraper Tool
 * Calls the deployed Cloudflare Worker at https://superlight-scraper.rutv.workers.dev
 *
 * Available actions:
 *  - scrape  : Full page extraction — JSON-LD, OpenGraph, text, markdown. Optional CSS selector.
 *  - links   : Extract all hyperlinks (internal + external) from a page
 *  - sitemap : Auto-discover robots.txt → sitemap.xml → return list of all site URLs
 *  - feed    : Auto-detect and parse RSS/Atom feeds from a page
 *  - batch   : Scrape up to 10 URLs in parallel
 */

const SCRAPER_WORKER_URL = "https://superlight-scraper.rutv.workers.dev";

const inputSchema = z.object({
  action: z
    .enum(["scrape", "links", "sitemap", "feed", "batch"])
    .describe(
      [
        "Action to perform — choose the most appropriate one:",
        '"scrape"   — Extract title, description, image, JSON-LD, OpenGraph, and article text from a single URL. Best for reading a specific page.',
        '"links"    — Extract all hyperlinks from a page (internal vs external). Best for site exploration or link auditing.',
        '"sitemap"  — Discover sitemap.xml via robots.txt and return all URLs on the site. Best for site mapping or deep crawl prep.',
        '"feed"     — Auto-detect and parse the RSS or Atom feed from a website. Best for getting latest articles/news from a blog.',
        '"batch"    — Scrape up to 10 URLs in parallel. Best when you need content from multiple pages at once.',
      ].join(" | "),
    ),

  url: z
    .string()
    .url()
    .optional()
    .describe(
      'Target URL (required for scrape, links, sitemap, feed). Must be http:// or https://. Not used for "batch" action.',
    ),

  urls: z
    .array(z.string().url())
    .max(10)
    .optional()
    .describe(
      'Array of URLs to scrape in parallel (required for "batch" action only, max 10).',
    ),

  format: z
    .enum(["json", "markdown"])
    .default("json")
    .optional()
    .describe(
      '"json" (default) returns structured metadata. "markdown" returns clean article text — best for blogs, news, and documentation pages.',
    ),

  selector: z
    .string()
    .optional()
    .describe(
      'CSS selector to extract only a specific element from the page (only for "scrape" action). Examples: ".article-body", "main", "#content", "h1".',
    ),

  ttl: z
    .number()
    .int()
    .min(60)
    .max(3600)
    .default(300)
    .optional()
    .describe("Cache TTL in seconds (60–3600). Default 300 (5 min)."),
});

export type ScrapeWebPageInput = z.infer<typeof inputSchema>;

export const scrapeWebPageTool = createTool({
  description:
    "Powerful web scraping tool backed by a global Cloudflare edge worker. Can scrape page content, extract all links, discover sitemaps, parse RSS/Atom feeds, or batch-scrape multiple URLs in parallel. Uses smart extraction (JSON-LD → OpenGraph → Jina AI → HTMLRewriter fallback) with edge KV caching. Works on ~80% of the public web including news, blogs, e-commerce, docs, and GitHub. Does NOT work on login-required pages or JS-only SPAs.",
  inputSchema,
  execute: async ({
    action,
    url,
    urls,
    format = "json",
    selector,
    ttl = 300,
  }) => {
    return safe(async () => {
      // ── batch ─────────────────────────────────────────────────────────────
      if (action === "batch") {
        if (!urls || urls.length === 0) {
          return {
            isError: true,
            guide:
              'The "batch" action requires a "urls" array with at least one URL.',
          };
        }
        const resp = await fetch(`${SCRAPER_WORKER_URL}/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls, format, ttl }),
        });
        const data = await resp.json();
        return {
          ...data,
          guide: `Batch scrape completed. ${data.successful}/${data.total} URLs succeeded in ${data.elapsed}ms. Use the results array to answer the user's question.`,
        };
      }

      // ── all single-URL actions require url ────────────────────────────────
      if (!url) {
        return {
          isError: true,
          guide: `The "${action}" action requires a "url" parameter.`,
        };
      }

      // ── links ─────────────────────────────────────────────────────────────
      if (action === "links") {
        const resp = await fetch(
          `${SCRAPER_WORKER_URL}/links?url=${encodeURIComponent(url)}`,
        );
        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        return {
          ...data,
          guide: `Found ${data.total} links (${data.internal} internal, ${data.external} external). Use these to help the user explore or audit the site.`,
        };
      }

      // ── sitemap ───────────────────────────────────────────────────────────
      if (action === "sitemap") {
        const resp = await fetch(
          `${SCRAPER_WORKER_URL}/sitemap?url=${encodeURIComponent(url)}`,
        );
        const data = await resp.json();
        if (data.error && resp.status === 404) {
          return {
            ...data,
            guide:
              "No sitemap found on this site. It may not publish one, or it may be at a non-standard path.",
          };
        }
        if (data.error) throw new Error(data.error);
        return {
          ...data,
          guide: `Found ${data.totalUrls} URLs in the sitemap. Type: ${data.type}. Use these URLs to help the user understand site structure or find specific pages.`,
        };
      }

      // ── feed ──────────────────────────────────────────────────────────────
      if (action === "feed") {
        const resp = await fetch(
          `${SCRAPER_WORKER_URL}/feed?url=${encodeURIComponent(url)}`,
        );
        const data = await resp.json();
        if (data.error && resp.status === 404) {
          return {
            ...data,
            guide:
              "No RSS or Atom feed detected on this page. The site may not publish one.",
          };
        }
        if (data.error) throw new Error(data.error);
        return {
          ...data,
          guide: `Successfully parsed ${data.type?.toUpperCase()} feed "${data.title}" with ${data.totalItems} items. Use the items to answer the user's question about recent content.`,
        };
      }

      // ── scrape (default) ─────────────────────────────────────────────────
      const params = new URLSearchParams({
        url,
        format: format ?? "json",
        ttl: String(ttl ?? 300),
      });
      if (selector) params.set("selector", selector);

      const resp = await fetch(`${SCRAPER_WORKER_URL}/scrape?${params}`, {
        headers: { Accept: "application/json" },
      });

      if (format === "markdown" && resp.ok) {
        const markdown = await resp.text();
        return {
          url,
          format: "markdown",
          content: markdown,
          _cached: resp.headers.get("X-Cache") === "HIT",
          _source: resp.headers.get("X-Source") ?? "unknown",
          guide:
            "Successfully retrieved markdown content. Use this to answer the user's question about the webpage.",
        };
      }

      const data = await resp.json();

      if (data.error) {
        return {
          url,
          error: data.error,
          guide:
            "The scraper could not extract content from this URL. It may be a JavaScript-only SPA, behind a login wall, or have anti-bot protection. Try using the steel-browser tool instead.",
        };
      }

      return {
        url: data.url,
        title: data.title,
        description: data.description,
        image: data.image,
        type: data.type,
        selector: data.selector,
        text: data.text,
        markdown: data.markdown,
        feeds: data.feeds,
        openGraph: data.openGraph,
        jsonLd: data.jsonLd,
        _cached: data._cached ?? false,
        _source: data._source,
        guide:
          "Successfully scraped the webpage. Use the data above to answer the user's question. If 'feeds' is present, mention that the site has an RSS/Atom feed available.",
      };
    })
      .ifFail((e) => ({
        isError: true,
        url,
        error: e.message,
        guide:
          "Web scraping failed. Inform the user and suggest they try a different URL, or use the steel-browser tool for JavaScript-heavy sites.",
      }))
      .unwrap();
  },
});
