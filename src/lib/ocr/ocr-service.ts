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

    // 2. Handle standard relative URLs
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
async function getImageData(imageUrl: string): Promise<Uint8Array | null> {
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
 * High-performance OCR using Qwen Vision model
 */
async function extractTextFromImageViaAI(imageUrl: string): Promise<string> {
  try {
    console.log(`OCR: Attempting extraction with Qwen Vision (VL)...`);

    // Fetch image data first so we don't pass a potentially unreachable URL to the AI
    const imageData = await getImageData(imageUrl);
    if (!imageData) {
      console.error(`OCR: Could not retrieve image data for URL: ${imageUrl}`);
      return "";
    }

    const model = customModelProvider.getModel({
      provider: "Qwen",
      model: "Qwen Vision (VL)",
    });

    const { text } = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Act as a high-precision OCR engine. Extract all text from this image exactly as it appears. Maintain formatting and layout. Return ONLY the extracted text without any prefix, suffix, or commentary.",
            },
            {
              type: "image",
              image: imageData, // Pass Uint8Array directly
            },
          ],
        },
      ],
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(25000),
    });

    if (text && text.trim().length > 0) {
      console.log(`OCR: Successfully extracted text using Qwen Vision`);
      return text.trim();
    }
  } catch (err: any) {
    console.error(`OCR: Qwen Vision failed: ${err.message || "Unknown error"}`);
    throw err;
  }

  return "";
}

export async function extractTextFromDocuments(
  text: string,
  links?: string[],
): Promise<string> {
  try {
    if (!links || links.length === 0) {
      console.log("OCR: No links provided");
      return text;
    }

    console.log(`OCR: Processing ${links.length} files`);

    // 1. Try local extraction for text/doc/pdf files first
    let extractedContent = "";
    const remainingLinks: string[] = [];

    for (const link of links) {
      const lowerLink = link.toLowerCase();
      try {
        // Simple text formats
        if (
          lowerLink.endsWith(".txt") ||
          lowerLink.endsWith(".md") ||
          lowerLink.endsWith(".json") ||
          lowerLink.endsWith(".csv")
        ) {
          console.log(`OCR: Fetching text content locally from ${link}`);
          const res = await fetchFile(link);
          if (res && res.ok) {
            const content = await res.text();
            extractedContent += `\n\n[File Content: ${link.split("/").pop()}]\n${content}\n`;
            continue; // Handled locally
          }
        }
        // Word Documents (.docx)
        else if (lowerLink.endsWith(".docx")) {
          console.log(`OCR: Fetching DOCX content locally from ${link}`);
          const res = await fetchFile(link);
          if (res && res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const result = await mammoth.extractRawText({ buffer });
            extractedContent += `\n\n[Document Content: ${link.split("/").pop()}]\n${result.value}\n`;
            continue;
          }
        }
        // PDF Documents (.pdf)
        else if (lowerLink.endsWith(".pdf")) {
          console.log(`OCR: Fetching PDF content locally from ${link}`);
          const res = await fetchFile(link);
          if (res && res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const pdf = require("pdf-parse-fork");
            const data = await pdf(buffer);
            extractedContent += `\n\n[Document Content: ${link.split("/").pop()}]\n${data.text}\n`;
            continue;
          }
        }
        // PowerPoint and Excel Documents (.ppt, .pptx, .xls, .xlsx)
        else if (
          lowerLink.endsWith(".ppt") ||
          lowerLink.endsWith(".pptx") ||
          lowerLink.endsWith(".xls") ||
          lowerLink.endsWith(".xlsx")
        ) {
          console.log(`OCR: Fetching Office content locally from ${link}`);
          const res = await fetchFile(link);
          if (res && res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const result = await officeparser.parseOfficeAsync(buffer);
            extractedContent += `\n\n[Document Content: ${link.split("/").pop()}]\n${result}\n`;
            continue;
          }
        }
      } catch (e) {
        console.error(`OCR: Local processing failed for ${link}`, e);
        // Fallback to external if local fails
      }

      // If not handled locally, add to remaining
      remainingLinks.push(link);
    }

    // 2. Process remaining (PDF/Image/Doc) via Vision AI or Cloud API
    if (remainingLinks.length > 0) {
      console.log(`OCR: Sending ${remainingLinks.length} files to Vision AI`);

      const externalResults = await Promise.all(
        remainingLinks.map(async (link) => {
          try {
            // Optimization: Skip OCR for very small files (less than 5KB)
            // as they are unlikely to contain readable text for the VL model
            // Check if link is a data URL to get size easily, otherwise skip check
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

            const text = await extractTextFromImageViaAI(link);
            if (text) {
              return `\n\n[Document Content: ${link.split("/").pop()}]\n${text}`;
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
 * Process file URLs from uploaded files
 * Extracts text from images and PDFs before sending to model
 * Only processes when files are actually uploaded (not for other attachments)
 */
export async function processFileURLsForModel(
  userMessage: string,
  fileUrls: string[],
): Promise<string> {
  if (!fileUrls || fileUrls.length === 0) {
    return userMessage;
  }

  // Filter for image, PDF, and document files - these are the files we can extract text from
  const supportedUrls = fileUrls.filter((url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();

    // Check for image files
    const isImage =
      lowerUrl.includes(".jpg") ||
      lowerUrl.includes(".jpeg") ||
      lowerUrl.includes(".png") ||
      lowerUrl.includes(".gif") ||
      lowerUrl.includes(".webp") ||
      lowerUrl.includes("data:image");

    // Check for PDF files
    const isPdf =
      lowerUrl.includes(".pdf") || lowerUrl.includes("data:application/pdf");

    // Check for document files (Word, PowerPoint, Excel, Text, CSV)
    const isDocument =
      lowerUrl.includes(".doc") ||
      lowerUrl.includes(".docx") ||
      lowerUrl.includes(".ppt") ||
      lowerUrl.includes(".pptx") ||
      lowerUrl.includes(".xls") ||
      lowerUrl.includes(".xlsx") ||
      lowerUrl.includes(".txt") ||
      lowerUrl.includes(".csv") ||
      lowerUrl.includes("data:application/msword") ||
      lowerUrl.includes(
        "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ) ||
      lowerUrl.includes("data:application/vnd.ms-powerpoint") ||
      lowerUrl.includes(
        "data:application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ) ||
      lowerUrl.includes("data:application/vnd.ms-excel") ||
      lowerUrl.includes(
        "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ) ||
      lowerUrl.includes("data:text/plain") ||
      lowerUrl.includes("data:text/csv");

    return isImage || isPdf || isDocument;
  });

  // Only process if we have supported files (images or PDFs)
  if (supportedUrls.length === 0) {
    return userMessage;
  }

  // Extract text from documents
  const enrichedMessage = await extractTextFromDocuments(
    userMessage,
    supportedUrls,
  );

  return enrichedMessage;
}
