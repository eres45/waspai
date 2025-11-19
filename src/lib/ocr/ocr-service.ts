/**
 * OCR Service - Extract text from images and PDFs
 * Uses sii3.top/api/OCR.php for document processing
 */

const OCR_API_URL = "https://sii3.top/api/OCR.php";

interface OCRResponse {
  success: boolean;
  data?: string;
  error?: string;
}

/**
 * Extract text from images and PDFs using OCR API
 * @param text - User query/instruction
 * @param links - Array of image/PDF URLs to process
 * @returns Extracted text from documents
 */
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
    console.log(`OCR: Links:`, links);

    // Format links as comma-separated string
    const linkString = links.join(",");

    // Build form data
    const formData = new URLSearchParams();
    formData.append("text", text);
    formData.append("link", linkString);

    console.log(`OCR: Sending request to ${OCR_API_URL}`);
    const response = await fetch(OCR_API_URL, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    console.log(`OCR: Response status: ${response.status}`);

    if (!response.ok) {
      console.error(`OCR API error: ${response.status}`);
      return text; // Fallback to original text
    }

    const result = (await response.json()) as OCRResponse;
    console.log(`OCR: Response success: ${result.success}`);
    console.log(`OCR: Extracted data length: ${result.data?.length || 0}`);

    if (result.success && result.data) {
      const enriched = `${text}\n\n[Document Content]\n${result.data}`;
      console.log(`OCR: Enriched message length: ${enriched.length}`);
      // Combine original text with extracted data
      return enriched;
    }

    console.log("OCR: No data in response");
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
