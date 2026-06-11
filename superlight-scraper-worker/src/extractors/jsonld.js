/**
 * Extract JSON-LD (Schema.org) structured data from HTML
 * Returns array of parsed JSON-LD objects
 */
export function extractJsonLd(html) {
  const results = [];
  const regex = /<script type="application\/ld\+json">(.*?)<\/script>/gis;
  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1].trim());
      // Handle both single objects and arrays
      if (Array.isArray(json)) {
        results.push(...json);
      } else {
        results.push(json);
      }
    } catch (_e) {
      // Malformed JSON-LD, skip
    }
  }

  return results;
}
