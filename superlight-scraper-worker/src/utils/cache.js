/**
 * KV Cache helpers with TTL
 */
export async function getCache(kv, key) {
  if (!kv) return null;
  return await kv.get(key);
}

export async function setCache(kv, key, value, ttlSeconds = 300) {
  if (!kv) return;
  // Cloudflare KV requires TTL to be at least 60 seconds
  const expirationTtl = Math.max(60, ttlSeconds);
  await kv.put(key, value, { expirationTtl });
}
