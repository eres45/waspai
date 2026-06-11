/**
 * Extract OpenGraph and essential meta tags from HTML
 * Uses regex for speed (Workers CPU limit friendly)
 */
export function extractOpenGraph(html) {
  const og = {};

  const metaTags = [
    ["title", "og:title"],
    ["description", "og:description"],
    ["image", "og:image"],
    ["url", "og:url"],
    ["type", "og:type"],
    ["site_name", "og:site_name"],
    ["locale", "og:locale"],
  ];

  for (const [key, property] of metaTags) {
    const regex = new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    );
    const match = html.match(regex);
    if (match) og[key] = match[1];
  }

  // Fallback to standard meta tags
  if (!og.title) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) og.title = titleMatch[1].trim();
  }

  if (!og.description) {
    const descMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    );
    if (descMatch) og.description = descMatch[1];
  }

  return og;
}
