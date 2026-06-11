/**
 * Extract all hyperlinks from a page using HTMLRewriter (streaming, zero memory overhead)
 * Deduplicates by absolute href, classifies internal vs external
 */
export async function extractLinks(response, baseUrl) {
  const links = new Map(); // deduplicate by absolute href
  const origin = new URL(baseUrl).origin;

  const rewriter = new HTMLRewriter().on("a[href]", {
    element(el) {
      const href = el.getAttribute("href");
      if (!href) return;
      // Skip anchors, javascript:, mailto:, tel:
      if (
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return;
      try {
        const abs = new URL(href, baseUrl).href;
        if (!links.has(abs)) {
          links.set(abs, {
            href: abs,
            rel: el.getAttribute("rel") || null,
            target: el.getAttribute("target") || null,
            type: abs.startsWith(origin) ? "internal" : "external",
          });
        }
      } catch {}
    },
  });

  await rewriter.transform(response).arrayBuffer();
  return Array.from(links.values());
}
