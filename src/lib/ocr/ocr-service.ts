/**
 * OCR Service - Extract text from images and PDFs
 * Uses sii3.top/api/OCR.php for document processing
 */

import mammoth from "mammoth";
import officeparser from "officeparser";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
// const pdf = require("pdf-parse"); // Lazy loaded below

const OCR_API_URL = "https://vetrex.x10.mx/api/extract_text.php";

interface OCRResponse {
  success: boolean;
  text?: string;
  error?: string;
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
          const res = await fetch(link);
          if (res.ok) {
            const content = await res.text();
            extractedContent += `\n\n[File Content: ${link.split("/").pop()}]\n${content}\n`;
            continue; // Handled locally
          }
        }
        // Word Documents (.docx)
        else if (lowerLink.endsWith(".docx")) {
          console.log(`OCR: Fetching DOCX content locally from ${link}`);
          const res = await fetch(link);
          if (res.ok) {
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
          const res = await fetch(link);
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const pdf = require("pdf-parse");
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
          const res = await fetch(link);
          if (res.ok) {
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

    // 2. Process remaining (PDF/Image/Doc) via External API
    if (remainingLinks.length > 0) {
      console.log(`OCR: Sending ${remainingLinks.length} files to Vetrex API`);

      const externalResults = await Promise.all(
        remainingLinks.map(async (link) => {
          try {
            const response = await fetch(OCR_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image_url: link }),
            });

            if (!response.ok) {
              console.error(`OCR API error for ${link}: ${response.status}`);
              return "";
            }

            const result = (await response.json()) as OCRResponse;
            if (result.success && result.text) {
              return `\n\n[Document Content: ${link.split("/").pop()}]\n${result.text}`;
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
