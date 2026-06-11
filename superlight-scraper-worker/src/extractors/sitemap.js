/**
 * robots.txt reader + sitemap.xml parser
 * Handles sitemap index files (recursive), gzipped sitemaps (fetched natively by CF)
 */

const BOT_UA =
  "SuperLightScraperBot/1.0 (+https://superlight-scraper.rutv.workers.dev)";

/**
 * Fetch robots.txt for a domain.
 * Returns discovered Sitemap: directives.
 */
export async function fetchRobots(baseUrl) {
  try {
    const origin = new URL(baseUrl).origin;
    const resp = await fetch(`${origin}/robots.txt`, {
      headers: { "User-Agent": BOT_UA },
      cf: { cacheTtl: 3600 },
    });
    if (!resp.ok) return { sitemaps: [], text: null };

    const text = await resp.text();
    const sitemaps = [];
    const regex = /^Sitemap:\s*(.+)$/gim;
    let match;
    while ((match = regex.exec(text)) !== null) {
      sitemaps.push(match[1].trim());
    }

    return { sitemaps, text };
  } catch {
    return { sitemaps: [], text: null };
  }
}

/**
 * Parse a sitemap URL.
 * Handles both regular sitemaps and sitemap index files.
 * maxUrls = 500 by default (keeps response size sane)
 */
export async function parseSitemap(sitemapUrl, maxUrls = 500) {
  const resp = await fetch(sitemapUrl, {
    headers: { "User-Agent": BOT_UA, Accept: "text/xml, application/xml, */*" },
    cf: { cacheTtl: 3600 },
  });
  if (!resp.ok) throw new Error(`Sitemap fetch failed: ${resp.status}`);

  const xml = await resp.text();

  // Sitemap index — contains references to other sitemaps
  if (xml.includes("<sitemapindex")) {
    const childUrls = extractLocs(xml);
    // Fetch first 5 child sitemaps in parallel
    const childResults = await Promise.allSettled(
      childUrls.slice(0, 5).map((u) => parseSitemapXml(u)),
    );
    const allUrls = childResults
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value)
      .slice(0, maxUrls);

    return {
      type: "sitemap-index",
      sitemapUrl,
      totalChildSitemaps: childUrls.length,
      childSitemaps: childUrls,
      urls: allUrls,
      totalUrls: allUrls.length,
    };
  }

  // Regular sitemap
  const urls = parseSitemapXml(xml);
  return {
    type: "sitemap",
    sitemapUrl,
    urls: urls.slice(0, maxUrls),
    totalUrls: urls.length,
  };
}

/**
 * Parse a sitemap XML string (or fetch from URL) and return URL entries
 */
async function parseSitemapXml(xmlOrUrl) {
  let xml = xmlOrUrl;
  // If it looks like a URL, fetch it
  if (xmlOrUrl.startsWith("http")) {
    try {
      const resp = await fetch(xmlOrUrl, {
        headers: { "User-Agent": BOT_UA },
        cf: { cacheTtl: 3600 },
      });
      if (!resp.ok) return [];
      xml = await resp.text();
    } catch {
      return [];
    }
  }

  const urls = [];
  const urlBlockRegex = /<url>([\s\S]*?)<\/url>/gi;
  let match;
  while ((match = urlBlockRegex.exec(xml)) !== null) {
    const block = match[1];
    const loc = extractXmlValue(block, "loc");
    if (!loc) continue;
    urls.push({
      url: loc,
      lastmod: extractXmlValue(block, "lastmod"),
      changefreq: extractXmlValue(block, "changefreq"),
      priority: (() => {
        const p = extractXmlValue(block, "priority");
        return p ? parseFloat(p) : null;
      })(),
    });
  }
  return urls;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function extractLocs(xml) {
  const locs = [];
  const regex = /<loc>([\s\S]*?)<\/loc>/gi;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    locs.push(match[1].trim());
  }
  return locs;
}

function extractXmlValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i"));
  return match ? match[1].trim() : null;
}
