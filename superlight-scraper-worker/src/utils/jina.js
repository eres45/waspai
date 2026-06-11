/**
 * Proxy request through Jina AI Reader
 * Free tier: 20 RPM no key, 200 RPM with key
 * Pass env.JINA_API_KEY to unlock higher rate limits
 */
export async function fetchViaJina(targetUrl, apiKey = null) {
  const cleanUrl = targetUrl.replace(/^https?:\/\//, "");
  const jinaUrl = `https://r.jina.ai/https://${cleanUrl}`;

  const headers = {
    Accept: "text/plain",
    "X-Return-Format": "markdown",
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const resp = await fetch(jinaUrl, { headers });

  if (!resp.ok) return null;

  const text = await resp.text();

  // Jina returns format:
  // Title: ...
  // URL: ...
  // Content: ...
  const lines = text.split("\n");
  const title = lines[0]?.replace(/^Title: /, "") || "";
  const urlLine = lines[1] || "";
  const content = lines.slice(2).join("\n").trim();

  return {
    title: title || null,
    url: urlLine.replace(/^URL: /, "") || null,
    text: content,
    markdown: text, // Raw markdown output
  };
}
