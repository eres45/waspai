import { tool as createTool } from "ai";
import { z } from "zod";
import { safe } from "ts-safe";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const imageSearchSchema = z.object({
  query: z
    .string()
    .describe(
      "Specific description or name of images to find (e.g. 'wolf in the wild', 'red fox')",
    ),
  numResults: z.coerce
    .number()
    .min(1)
    .max(50)
    .default(10)
    .describe("Number of image results to return (default: 10)"),
});

export interface ImageSearchResult {
  title: string;
  image: string;
  thumbnail: string;
  url: string;
  domain: string;
  source?: string;
  width?: number;
  height?: number;
}

export interface ImageSearchResponse {
  query: string;
  results: ImageSearchResult[];
  durationMs?: number;
}

function getHostname(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

let cachedPythonPath: string | null = null;
function resolvePythonPath(): string {
  if (cachedPythonPath) return cachedPythonPath;
  const candidates = [
    "C:\\Program Files\\Python312\\python.exe",
    "C:\\Python312\\python.exe",
    "python.exe",
    "python3.exe",
    "python",
  ];
  for (const cand of candidates) {
    if (cand.includes("\\") && existsSync(cand)) {
      cachedPythonPath = cand;
      return cand;
    }
  }
  cachedPythonPath = "python";
  return cachedPythonPath;
}

async function fetchWikimediaImages(
  query: string,
  maxResults: number,
): Promise<ImageSearchResult[]> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${maxResults}&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "WaspAI/1.0 (contact@waspai.app)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data?.query?.pages || {};
    const results: ImageSearchResult[] = [];
    for (const pid of Object.keys(pages)) {
      const p = pages[pid];
      const info = p.imageinfo?.[0];
      if (info?.thumburl || info?.url) {
        results.push({
          title: (p.title || "").replace(/^File:/, "").replace(/\.[^.]+$/, ""),
          thumbnail: info.thumburl || info.url,
          image: info.url || info.thumburl,
          url: info.descriptionurl || "https://commons.wikimedia.org",
          domain: "commons.wikimedia.org",
          source: "Wikimedia Commons",
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function fetchDdgsImages(
  query: string,
  maxResults: number,
): Promise<ImageSearchResult[]> {
  const scriptPath = join(
    process.cwd(),
    "src",
    "lib",
    "ai",
    "tools",
    "web",
    "safe_image_search.py",
  );
  if (!existsSync(scriptPath)) {
    return [];
  }

  return new Promise((resolve) => {
    const pythonBin = resolvePythonPath();
    let stdout = "";
    let proc: any = null;

    const timer = setTimeout(() => {
      if (proc) {
        try {
          proc.kill();
        } catch {}
      }
      resolve([]);
    }, 8000);

    try {
      proc = spawn(pythonBin, [scriptPath, query, String(maxResults)], {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });

      proc.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });

      proc.on("error", () => {
        clearTimeout(timer);
        resolve([]);
      });

      proc.on("close", (code: number) => {
        clearTimeout(timer);
        if (code !== 0 || !stdout.trim()) {
          return resolve([]);
        }
        try {
          const raw = JSON.parse(stdout.trim());
          if (!Array.isArray(raw)) return resolve([]);
          const items: ImageSearchResult[] = raw.map((r: any) => ({
            title: r.title || query,
            image: r.image || r.thumbnail,
            thumbnail: r.thumbnail || r.image,
            url: r.url || "",
            domain: getHostname(r.url) || r.source || "web",
            source: r.source,
            width: r.width ? Number(r.width) : undefined,
            height: r.height ? Number(r.height) : undefined,
          }));
          resolve(items);
        } catch {
          resolve([]);
        }
      });
    } catch {
      clearTimeout(timer);
      resolve([]);
    }
  });
}

export const imageSearchTool = createTool({
  description:
    "Search the web for photos, stock pictures, animal photos, wallpapers, and graphics. Returns direct image URLs, thumbnails, titles, and source domains. Use this whenever the user asks to find images, search for photos, or create image-based documents.",
  inputSchema: imageSearchSchema,
  execute: (params) => {
    return safe(async () => {
      const startTime = Date.now();
      const query = (params.query || "").trim();
      const numResults = params.numResults || 10;

      if (!query) {
        return {
          query: "",
          results: [],
          durationMs: 0,
        };
      }

      // Try DDGS first (Bing + DuckDuckGo Image backends)
      let results = await fetchDdgsImages(query, numResults);

      // Fallback to Wikimedia Commons if DDGS returns empty
      if (!results || results.length === 0) {
        results = await fetchWikimediaImages(query, numResults);
      }

      return {
        query,
        results,
        durationMs: Date.now() - startTime,
      };
    })
      .ifFail((err) => ({
        query: params.query,
        results: [],
        error: err.message,
        durationMs: 0,
      }))
      .unwrap();
  },
});
