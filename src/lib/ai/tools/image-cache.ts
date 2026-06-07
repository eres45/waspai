/**
 * image-cache.ts
 *
 * Server-side in-memory cache for base64 image data.
 *
 * Problem it solves:
 *   When fetch_image_as_base64 returns a full base64 string in the tool result,
 *   that 350KB+ string gets added to the AI message history. On the next request,
 *   ALL messages (including the giant base64) are sent to the model, blowing past
 *   the context window and causing "max_tokens must be at least 1, got -XXXXXX".
 *
 * Solution:
 *   - Store the base64 in this module-level Map
 *   - Return only a short ref token (e.g. "wsp-img://abc123") to the AI
 *   - The html_preview and write_site_file tools resolve refs → base64 before use
 *   - Entries auto-expire after 30 minutes
 */

interface CacheEntry {
  dataUri: string;
  mimeType: string;
  sizeKb: number;
  label: string | null;
  expiresAt: number;
}

const TTL_MS = 30 * 60 * 1000; // 30 minutes
const PREFIX = "wsp-img://";

// Module-level cache — lives for the lifetime of the server process
const cache = new Map<string, CacheEntry>();

function generateToken(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  }
}

/**
 * Store a base64 data URI and return a short ref token.
 * The token looks like: "wsp-img://a1b2c3d4e5f6"
 */
export function storeImage(
  dataUri: string,
  mimeType: string,
  sizeKb: number,
  label: string | null,
): string {
  evictExpired();
  const token = generateToken();
  cache.set(token, {
    dataUri,
    mimeType,
    sizeKb,
    label,
    expiresAt: Date.now() + TTL_MS,
  });
  return `${PREFIX}${token}`;
}

/**
 * Resolve a ref token back to its base64 data URI.
 * Returns null if not found or expired.
 */
export function resolveImage(ref: string): string | null {
  const token = ref.startsWith(PREFIX) ? ref.slice(PREFIX.length) : ref;
  const entry = cache.get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(token);
    return null;
  }
  return entry.dataUri;
}

/**
 * Replace all "wsp-img://TOKEN" occurrences in an HTML string
 * with their actual base64 data URIs from the cache.
 *
 * Call this before rendering or saving any HTML that may contain image refs.
 */
export function resolveImageRefs(html: string): string {
  const pattern = new RegExp(
    `${PREFIX.replace("://", ":\\/\\/")}([a-z0-9]+)`,
    "g",
  );
  return html.replace(pattern, (_match, token) => {
    const entry = cache.get(token);
    if (!entry || entry.expiresAt < Date.now()) {
      // Ref expired or unknown — return a transparent 1x1 placeholder
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    }
    return entry.dataUri;
  });
}

/** How many images are currently cached (for debugging). */
export function cacheSize(): number {
  evictExpired();
  return cache.size;
}
