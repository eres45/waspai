/**
 * OCR Service - Extract text from images and PDFs
 * Uses sii3.top/api/OCR.php for document processing
 */

import mammoth from "mammoth";
import officeparser from "officeparser";
import { createRequire } from "module";
import { generateText } from "ai";
import { customModelProvider } from "../ai/models";

const require = createRequire(import.meta.url);

// Typed dynamic import for Tesseract
type TesseractWorker = import("tesseract.js").Worker;
let _tesseractWorker: TesseractWorker | null = null;
let _requestCount = 0;

/**
 * Singleton worker management for Tesseract to prevent memory leaks.
 * Recreates worker after 50 requests.
 */
async function getTesseractWorker(): Promise<TesseractWorker> {
  _requestCount++;
  if (_tesseractWorker && _requestCount > 50) {
    console.log("OCR: Terminating Tesseract worker to prevent memory leaks");
    await _tesseractWorker.terminate();
    _tesseractWorker = null;
    _requestCount = 0;
  }
  if (!_tesseractWorker) {
    console.log(`OCR: Initializing new Tesseract worker`);
    // Use eslint-disable for @ts-ignore because it might be unecessary locally but needed on Vercel
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Module might not be resolved during static build phase
    const { createWorker } = await import("tesseract.js");
    _tesseractWorker = await createWorker("eng", 1, {
      cachePath: "/tmp",
      langPath: "/tmp",
      // Remove explicit CDN URLs to see if local resolution is faster on the server
    });
  }
  return _tesseractWorker;
}
// const pdf = require("pdf-parse"); // Lazy loaded below

/**
 * Universal helper to fetch file data from internal or external URLs.
 * Handles relative URLs, Telegram proxied URLs, and standard URLs.
 */
async function fetchFile(url: string): Promise<Response | null> {
  try {
    // 1. Handle internal Telegram proxy URLs (/api/storage/file/...)
    if (url.includes("/api/storage/file/")) {
      const filePath = url.split("/api/storage/file/")[1];
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (filePath && botToken) {
        const tgUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
        console.log(`OCR: Fetching direct from Telegram: ${filePath}`);
        return await fetch(tgUrl);
      }
    }

    // 2. Handle Cloudflare worker serve URLs (/serve?path=...)
    if (
      url.includes("path=") &&
      (url.includes("/serve") || url.includes("workers.dev"))
    ) {
      try {
        const parsedUrl = new URL(url);
        const filePath = parsedUrl.searchParams.get("path");
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (filePath && botToken) {
          const tgUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
          console.log(
            `OCR: Fetching direct from Telegram using query param path: ${filePath}`,
          );
          return await fetch(tgUrl);
        }
      } catch (e) {
        console.error("OCR: Failed to parse serve URL with searchParams:", e);
      }
    }

    // 3. Handle standard relative URLs
    let finalUrl = url;
    if (url.startsWith("/")) {
      const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      finalUrl = `${host}${url}`;
    }

    return await fetch(finalUrl);
  } catch (err) {
    console.error(`OCR: Fetch failed for ${url}:`, err);
    return null;
  }
}

/**
 * Helper to fetch image data and convert to Uint8Array for the AI SDK.
 */
export async function getImageData(
  imageUrl: string,
): Promise<Uint8Array | null> {
  // Handle base64 data URLs
  if (imageUrl.startsWith("data:")) {
    try {
      const base64 = imageUrl.split(",")[1];
      if (!base64) return null;
      return Buffer.from(base64, "base64");
    } catch {
      return null;
    }
  }

  const res = await fetchFile(imageUrl);
  if (res && res.ok) {
    const arrayBuffer = await res.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
  return null;
}

/**
 * Free OCR using Tesseract.js (MIT Licensed)
 * Runs locally without API keys
 */
export async function extractTextFromImageViaTesseract(
  imageData: Uint8Array,
): Promise<string> {
  const timerId = "OCR-Tesseract-" + Math.random().toString(36).substring(7);
  console.time(timerId);
  try {
    const worker = await getTesseractWorker();
    const {
      data: { text },
    } = await worker.recognize(Buffer.from(imageData));

    console.timeEnd(timerId);
    if (text && text.trim().length > 0) {
      console.log(`OCR: Successfully extracted text using Tesseract.js`);
      return text.trim();
    }
  } catch (err: any) {
    console.warn(`OCR: Tesseract.js failed: ${err.message || "Unknown error"}`);
    // If it fails, reset the singleton just in case
    if (_tesseractWorker) {
      _tesseractWorker.terminate();
      _tesseractWorker = null;
    }
  }
  return "";
}

/**
 * Free OCR using Cloudflare Workers AI (Llama 3.2 Vision)
 */
export async function extractTextFromImageViaCloudflare(
  imageData: Uint8Array,
): Promise<string> {
  const workerUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL;
  const authToken = process.env.CLOUDFLARE_WORKER_AUTH_TOKEN;

  if (!workerUrl || !authToken) {
    console.warn("OCR: Cloudflare Worker config missing");
    return "";
  }

  try {
    console.log(`OCR: Attempting extraction with Cloudflare AI Vision...`);
    const base64 = Buffer.from(imageData).toString("base64");

    const res = await fetch(`${workerUrl}/vision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": authToken,
      },
      body: JSON.stringify({ image: base64 }),
      signal: AbortSignal.timeout(4000), // Hard 4s timeout
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.response || data.text || "";
      if (text.trim()) {
        console.log(`OCR: Successfully extracted text using Cloudflare Vision`);
        return text.trim();
      }
    } else {
      console.warn(`OCR: Cloudflare Worker vision failed: ${res.statusText}`);
    }
  } catch (err: any) {
    console.warn(
      `OCR: Cloudflare Vision failed: ${err.message || "Unknown error"}`,
    );
  }
  return "";
}

/**
 * High-performance OCR using AI SDK (Llama 3.2 Vision)
 * Used as a secondary fallback
 */
export async function extractTextFromImageViaAI(
  imageUrl: string,
  imageData: Uint8Array,
  customPrompt?: string,
): Promise<string> {
  try {
    console.log(
      `OCR: Attempting extraction with Groq Worker Llama 4 Scout Vision...`,
    );

    const model = customModelProvider.getModel({
      provider: "Meta",
      model: "groqw-llama-4-scout",
    });

    // Convert Uint8Array to Base64 Data URL for maximum compatibility with custom proxies
    const base64 = Buffer.from(imageData).toString("base64");
    let mimeType = "image/jpeg";
    if (imageUrl.toLowerCase().endsWith(".png")) mimeType = "image/png";
    else if (imageUrl.toLowerCase().endsWith(".webp")) mimeType = "image/webp";
    else if (imageUrl.toLowerCase().endsWith(".gif")) mimeType = "image/gif";

    const dataUrl = `data:${mimeType};base64,${base64}`;

    const { text } = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                customPrompt ||
                "Act as a high-precision vision and OCR engine. Describe this image in detail and extract all visible text exactly as it appears. Maintain formatting and layout. Return a detailed, clear description of the image content and its text so that another language model can fully understand it even if the user didn't ask.",
            },
            {
              type: "image",
              image: dataUrl, // Pass as Data URL string
            },
          ],
        },
      ],
      maxRetries: 1, // Fail fast on hobby tier
      abortSignal: AbortSignal.timeout(8000), // Strict timeout for fallback
    });

    if (text && text.trim().length > 0) {
      console.log(`OCR: Successfully analyzed image using Groq Vision`);
      return text.trim();
    }
  } catch (err: any) {
    console.error(`OCR: Groq Vision failed: ${err.message || "Unknown error"}`);
    throw err;
  }

  return "";
}

export interface FileAttachment {
  url: string;
  mediaType?: string;
  filename?: string;
}

export async function extractTextFromDocuments(
  text: string,
  links?: (string | FileAttachment)[],
): Promise<string> {
  try {
    if (!links || links.length === 0) {
      console.log("OCR: No links provided");
      return text;
    }

    console.log(`OCR: Processing ${links.length} files`);

    // Normalize to FileAttachment objects
    const attachments: FileAttachment[] = links.map((l) =>
      typeof l === "string" ? { url: l } : l,
    );

    // 1. Try local extraction for text/doc/pdf files first
    let extractedContent = "";
    const remainingAttachments: FileAttachment[] = [];

    for (const att of attachments) {
      const link = att.url;
      const lowerLink = link.toLowerCase();
      const lowerFilename = (att.filename || "").toLowerCase();
      const mediaType = (att.mediaType || "").toLowerCase();

      // Detect file type: prefer mime type, fall back to URL/filename extension
      const isTextByMime =
        mediaType.startsWith("text/") ||
        mediaType === "application/json" ||
        mediaType === "application/javascript" ||
        mediaType === "application/typescript" ||
        mediaType === "application/xml";

      const isTextByExt =
        [lowerLink, lowerFilename].some(
          (s) =>
            s.endsWith(".txt") ||
            s.endsWith(".md") ||
            s.endsWith(".json") ||
            s.endsWith(".csv") ||
            s.endsWith(".tsv") ||
            s.endsWith(".tsx") ||
            s.endsWith(".ts") ||
            s.endsWith(".js") ||
            s.endsWith(".jsx") ||
            s.endsWith(".html") ||
            s.endsWith(".css") ||
            s.endsWith(".py") ||
            s.endsWith(".sql") ||
            s.endsWith(".yaml") ||
            s.endsWith(".yml") ||
            s.endsWith(".toml") ||
            s.endsWith(".xml") ||
            s.endsWith(".go") ||
            s.endsWith(".rs") ||
            s.endsWith(".sh"),
        ) ||
        lowerLink.includes("data:text/") ||
        lowerLink.includes("data:application/json") ||
        lowerLink.includes("data:text/javascript");

      try {
        // Simple text / code formats
        if (isTextByMime || isTextByExt) {
          const displayName = att.filename || link.split("/").pop() || "file";
          console.log(
            `OCR: Fetching text content locally from ${link} (${mediaType})`,
          );
          const res = await fetchFile(link);
          if (res && res.ok) {
            const content = await res.text();
            extractedContent += `\n\n[File Content: ${displayName}]\n${content}\n`;
            continue; // Handled locally
          }
        }
        // Word Documents (.docx)
        else if (
          mediaType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          mediaType === "application/msword" ||
          [lowerLink, lowerFilename].some(
            (s) => s.endsWith(".docx") || s.endsWith(".doc"),
          )
        ) {
          const displayName =
            att.filename || link.split("/").pop() || "document.docx";
          console.log(`OCR: Fetching DOCX content locally from ${link}`);
          const res = await fetchFile(link);
          if (res && res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const result = await mammoth.extractRawText({ buffer });
            extractedContent += `\n\n[Document Content: ${displayName}]\n${result.value}\n`;
            continue;
          }
        }
        // PDF Documents — detect by mime type OR extension
        else if (
          mediaType === "application/pdf" ||
          [lowerLink, lowerFilename].some((s) => s.endsWith(".pdf"))
        ) {
          const displayName =
            att.filename || link.split("/").pop() || "document.pdf";
          console.log(
            `OCR: Fetching PDF content locally from ${link} (${mediaType})`,
          );
          const res = await fetchFile(link);
          if (res && res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const pdf = require("pdf-parse-fork");
            const data = await pdf(buffer);
            if (data.text && data.text.trim().length > 0) {
              extractedContent += `\n\n[Document Content: ${displayName}]\n${data.text}\n`;
              continue;
            } else {
              // PDF has no extractable text (scanned/image PDF), fall through to vision AI
              console.log(
                `OCR: PDF has no text layer, falling back to vision: ${displayName}`,
              );
            }
          }
        }
        // PowerPoint and Excel Documents
        else if (
          [lowerLink, lowerFilename].some(
            (s) =>
              s.endsWith(".ppt") ||
              s.endsWith(".pptx") ||
              s.endsWith(".xls") ||
              s.endsWith(".xlsx"),
          ) ||
          mediaType.includes("presentationml") ||
          mediaType.includes("spreadsheetml") ||
          mediaType.includes("ms-powerpoint") ||
          mediaType.includes("ms-excel")
        ) {
          const displayName =
            att.filename || link.split("/").pop() || "document";
          console.log(`OCR: Fetching Office content locally from ${link}`);
          const res = await fetchFile(link);
          if (res && res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const result = await officeparser.parseOfficeAsync(buffer);
            extractedContent += `\n\n[Document Content: ${displayName}]\n${result}\n`;
            continue;
          }
        }
      } catch (e) {
        console.error(`OCR: Local processing failed for ${link}`, e);
        // Fallback to vision AI if local fails
      }

      // If not handled locally (images, scanned PDFs), add to vision AI queue
      remainingAttachments.push(att);
    }

    // 2. Process remaining (images, scanned PDFs) via Vision AI
    if (remainingAttachments.length > 0) {
      console.log(
        `OCR: Sending ${remainingAttachments.length} files to Vision AI`,
      );

      const externalResults = await Promise.all(
        remainingAttachments.map(async (att) => {
          const link = att.url;
          const displayName = att.filename || link.split("/").pop() || "file";
          try {
            // Skip data URLs that are very small (<5KB)
            if (link.startsWith("data:")) {
              const base64Length = link.split(",")[1]?.length || 0;
              const sizeInBytes = (base64Length * 3) / 4;
              if (sizeInBytes < 5000) {
                console.log(
                  `OCR: Skipping very small file (<5KB): ${link.substring(0, 30)}...`,
                );
                return "";
              }
            }

            // Fetch image/file data
            const imageData = await getImageData(link);
            if (!imageData) return "";

            // Use Groq Vision for images
            const text = await extractTextFromImageViaAI(link, imageData);

            if (text) {
              return `\n\n[Document Content: ${displayName}]\n${text}`;
            }
          } catch (err) {
            console.error(`OCR extraction error for ${link}:`, err);
          }
          return "";
        }),
      );

      extractedContent += externalResults.join("");
    }

    if (extractedContent) {
      return `${text}\n\n=== EXTRACTED DOCUMENT CONTENT ===\n${extractedContent}\n=== END OF DOCUMENTS ===`;
    }

    return text;
  } catch (error) {
    console.error("OCR extraction error:", error);
    return text; // Fallback to original text on error
  }
}

/**
 * Process file attachments from uploaded files.
 * Accepts full attachment metadata so file type can be detected via mime type
 * even when the storage URL has no file extension (e.g. Telegram/Cloudflare file IDs).
 */
export async function processFileURLsForModel(
  userMessage: string,
  fileAttachments: (string | FileAttachment)[],
): Promise<string> {
  if (!fileAttachments || fileAttachments.length === 0) {
    return userMessage;
  }

  // Normalize to FileAttachment objects
  const attachments: FileAttachment[] = fileAttachments.map((f) =>
    typeof f === "string" ? { url: f } : f,
  );

  // Filter for files we can extract content from.
  // Use BOTH mime type (from attachment metadata) AND URL/filename extension.
  const supported = attachments.filter((att) => {
    if (!att.url) return false;
    const lowerUrl = att.url.toLowerCase();
    const lowerFilename = (att.filename || "").toLowerCase();
    const mediaType = (att.mediaType || "").toLowerCase();

    // Images — by mime type or extension
    if (
      mediaType.startsWith("image/") ||
      lowerUrl.includes("data:image") ||
      [lowerUrl, lowerFilename].some((s) =>
        [".jpg", ".jpeg", ".png", ".gif", ".webp"].some((ext) =>
          s.endsWith(ext),
        ),
      )
    )
      return true;

    // PDFs — by mime type or extension
    if (
      mediaType === "application/pdf" ||
      lowerUrl.includes("data:application/pdf") ||
      [lowerUrl, lowerFilename].some((s) => s.endsWith(".pdf"))
    )
      return true;

    // Text / code files — by mime type or extension
    if (
      mediaType.startsWith("text/") ||
      mediaType === "application/json" ||
      mediaType === "application/javascript" ||
      mediaType === "application/typescript" ||
      mediaType === "application/xml" ||
      lowerUrl.includes("data:text/") ||
      lowerUrl.includes("data:application/json") ||
      [lowerUrl, lowerFilename].some((s) =>
        [
          ".txt",
          ".md",
          ".json",
          ".csv",
          ".tsv",
          ".tsx",
          ".ts",
          ".js",
          ".jsx",
          ".html",
          ".css",
          ".py",
          ".sql",
          ".yaml",
          ".yml",
          ".toml",
          ".xml",
          ".go",
          ".rs",
          ".sh",
          ".c",
          ".cpp",
          ".java",
        ].some((ext) => s.endsWith(ext)),
      )
    )
      return true;

    // Office documents — by mime type or extension
    if (
      mediaType.includes("wordprocessingml") ||
      mediaType.includes("presentationml") ||
      mediaType.includes("spreadsheetml") ||
      mediaType === "application/msword" ||
      mediaType.includes("ms-powerpoint") ||
      mediaType.includes("ms-excel") ||
      [lowerUrl, lowerFilename].some((s) =>
        [".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"].some((ext) =>
          s.endsWith(ext),
        ),
      )
    )
      return true;

    return false;
  });

  if (supported.length === 0) {
    console.log("OCR: No supported files detected for extraction");
    return userMessage;
  }

  console.log(
    `OCR: Extracting content from ${supported.length} file(s):`,
    supported.map(
      (a) =>
        `${a.filename || a.url.split("/").pop()} (${a.mediaType || "unknown"})`,
    ),
  );

  return extractTextFromDocuments(userMessage, supported);
}
