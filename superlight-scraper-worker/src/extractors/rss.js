/**
 * RSS / Atom feed auto-detection and parsing
 * Uses regex — no XML parser needed, runs in <1ms on Workers
 */

/**
 * Scan HTML for <link type="application/rss+xml"> or atom+xml tags
 * Returns array of feed descriptors
 */
export function detectFeedUrls(html, baseUrl) {
  const feeds = [];
  const regex =
    /<link[^>]+type=["'](application\/(?:rss|atom)\+xml)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const tag = match[0];
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    const titleMatch = tag.match(/title=["']([^"']+)["']/i);
    if (hrefMatch) {
      try {
        feeds.push({
          url: new URL(hrefMatch[1], baseUrl).href,
          type: match[1].includes("atom") ? "atom" : "rss",
          title: titleMatch ? titleMatch[1] : null,
        });
      } catch {}
    }
  }
  return feeds;
}

/**
 * Fetch and parse an RSS or Atom feed from a URL
 * Auto-detects feed type from XML content
 */
export async function fetchAndParseFeed(feedUrl) {
  const resp = await fetch(feedUrl, {
    headers: {
      Accept: "application/rss+xml, application/atom+xml, text/xml, */*",
    },
  });
  if (!resp.ok) throw new Error(`Feed fetch failed: ${resp.status}`);
  const xml = await resp.text();

  if (xml.includes("<feed") && xml.includes("xmlns")) {
    return parseAtomFeed(xml, feedUrl);
  }
  return parseRssFeed(xml, feedUrl);
}

/**
 * Parse RSS 2.0 XML
 */
export function parseRssFeed(xml, feedUrl) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    items.push({
      title: extractXmlText(block, "title"),
      link: extractXmlText(block, "link"),
      description: extractXmlText(block, "description"),
      pubDate: extractXmlText(block, "pubDate"),
      guid: extractXmlText(block, "guid"),
      author:
        extractXmlText(block, "author") || extractXmlText(block, "dc:creator"),
      category: extractXmlText(block, "category"),
    });
  }
  return {
    feedUrl,
    type: "rss",
    title: extractXmlText(xml, "title"),
    link: extractXmlText(xml, "link"),
    description: extractXmlText(xml, "description"),
    language: extractXmlText(xml, "language"),
    items: items.slice(0, 50),
    totalItems: items.length,
  };
}

/**
 * Parse Atom XML
 */
export function parseAtomFeed(xml, feedUrl) {
  const items = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    // Atom uses <link href="..."> instead of <link>text</link>
    const linkMatch =
      block.match(
        /<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i,
      ) || block.match(/<link[^>]+href=["']([^"']+)["']/i);
    items.push({
      title: extractXmlText(block, "title"),
      link: linkMatch ? linkMatch[1] : null,
      summary:
        extractXmlText(block, "summary") || extractXmlText(block, "content"),
      published:
        extractXmlText(block, "published") || extractXmlText(block, "updated"),
      id: extractXmlText(block, "id"),
      author: extractXmlText(block, "name"),
    });
  }
  return {
    feedUrl,
    type: "atom",
    title: extractXmlText(xml, "title"),
    description: extractXmlText(xml, "subtitle"),
    link: null,
    items: items.slice(0, 50),
    totalItems: items.length,
  };
}

// ─── helpers ────────────────────────────────────────────────────────────────

function extractXmlText(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  if (!match) return null;
  return stripCdata(match[1].trim());
}

function stripCdata(text) {
  if (!text) return text;
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}
