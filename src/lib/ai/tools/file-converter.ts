import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";
import { serverFileStorage } from "lib/file-storage";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

/**
 * Helper to fetch file bytes from a URL.
 * Supports relative, Telegram, and standard URLs.
 */
async function downloadFile(url: string): Promise<Buffer> {
  try {
    let finalUrl = url;

    // Telegram proxy fallback
    if (url.includes("/api/storage/file/")) {
      const filePath = url.split("/api/storage/file/")[1];
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (filePath && botToken) {
        finalUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
      }
    } else if (url.startsWith("/")) {
      const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      finalUrl = `${host}${url}`;
    }

    logger.info(`File Converter: Fetching file from ${finalUrl}`);
    const res = await fetch(finalUrl);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    logger.error(`File Converter: Download failed for ${url}`, error);
    throw new Error(
      `Failed to download source file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Generate PDF from plain text on the server using jsPDF
 */
async function textToPdf(text: string, title: string): Promise<Buffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = 180;

  let y = margin;

  if (title) {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, margin, y);
    y += 12;
  }

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);

  const lines = text.split("\n");
  for (const line of lines) {
    const splitLines = doc.splitTextToSize(line || " ", contentWidth);
    for (const splitLine of splitLines) {
      if (y + 6 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(splitLine, margin, y);
      y += 6;
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}

export const fileConverterTool = createTool({
  name: "convert-file",
  description:
    "Convert any file from one format to another (e.g. Word to PDF, PDF to Word, Excel to CSV, CSV to Excel, and various image formats like PNG/JPG/WebP/GIF). Provide the source file URL and the desired target format.",
  inputSchema: z.object({
    fileUrl: z
      .string()
      .describe("The public or storage URL of the file to convert."),
    targetFormat: z
      .enum([
        "pdf",
        "docx",
        "txt",
        "csv",
        "xlsx",
        "png",
        "jpg",
        "jpeg",
        "webp",
        "gif",
        "avif",
        "tiff",
      ])
      .describe("The target format to convert the file into."),
    filename: z
      .string()
      .optional()
      .describe(
        "Optional custom filename for the output (without the file extension).",
      ),
    width: z
      .number()
      .optional()
      .describe(
        "For image conversions, optional width in pixels to resize (preserves aspect ratio).",
      ),
    height: z
      .number()
      .optional()
      .describe(
        "For image conversions, optional height in pixels to resize (preserves aspect ratio).",
      ),
    quality: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe(
        "For image conversions, optional quality/compression from 1 to 100.",
      ),
  }),
  execute: async ({
    fileUrl,
    targetFormat,
    filename,
    width,
    height,
    quality,
  }) => {
    logger.info(
      `File Converter: Starting conversion of ${fileUrl} to ${targetFormat}`,
    );

    try {
      const sourceBuffer = await downloadFile(fileUrl);

      // Determine original filename from URL
      const urlPath = new URL(
        fileUrl.startsWith("http") ? fileUrl : `http://localhost${fileUrl}`,
      ).pathname;
      const originalFilename = decodeURIComponent(
        urlPath.split("/").pop() || "file",
      );
      const originalNameWithoutExt =
        originalFilename.substring(0, originalFilename.lastIndexOf(".")) ||
        originalFilename;
      const sourceExtension =
        originalFilename.split(".").pop()?.toLowerCase() || "";

      const outputName = filename || originalNameWithoutExt;
      const outputFilename = `${outputName}.${targetFormat}`;

      let outputBuffer: Buffer;
      let contentType = "";

      // List of supported image formats for Sharp
      const imageExtensions = [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif",
        "avif",
        "tiff",
      ];
      const isSourceImage = imageExtensions.includes(sourceExtension);
      const isTargetImage = imageExtensions.includes(targetFormat);

      // --- Category 1: Image to Image (using Sharp) ---
      if (isSourceImage || isTargetImage) {
        const sharp = (await import("sharp")).default;
        let sharpInstance = sharp(sourceBuffer);

        if (width || height) {
          sharpInstance = sharpInstance.resize(width, height, {
            fit: "inside",
            withoutEnlargement: true,
          });
        }

        const q = quality || 80;

        switch (targetFormat) {
          case "png":
            outputBuffer = await sharpInstance.png().toBuffer();
            contentType = "image/png";
            break;
          case "jpg":
          case "jpeg":
            outputBuffer = await sharpInstance.jpeg({ quality: q }).toBuffer();
            contentType = "image/jpeg";
            break;
          case "webp":
            outputBuffer = await sharpInstance.webp({ quality: q }).toBuffer();
            contentType = "image/webp";
            break;
          case "gif":
            outputBuffer = await sharpInstance.gif().toBuffer();
            contentType = "image/gif";
            break;
          case "avif":
            outputBuffer = await sharpInstance.avif({ quality: q }).toBuffer();
            contentType = "image/avif";
            break;
          case "tiff":
            outputBuffer = await sharpInstance.tiff().toBuffer();
            contentType = "image/tiff";
            break;
          default:
            throw new Error(
              `Cannot convert image format ${sourceExtension} to non-image format ${targetFormat}`,
            );
        }
      }
      // --- Category 2: Word (.docx) to PDF/TXT ---
      else if (sourceExtension === "docx" && targetFormat === "pdf") {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: sourceBuffer });
        outputBuffer = await textToPdf(result.value, outputName);
        contentType = "application/pdf";
      } else if (sourceExtension === "docx" && targetFormat === "txt") {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: sourceBuffer });
        outputBuffer = Buffer.from(result.value, "utf-8");
        contentType = "text/plain";
      }
      // --- Category 3: PDF to Word (.docx) / TXT ---
      else if (sourceExtension === "pdf" && targetFormat === "docx") {
        const pdfParser = require("pdf-parse-fork");
        const pdfData = await pdfParser(sourceBuffer);
        const text = pdfData.text || "";

        const { Document, Packer, Paragraph } = await import("docx");
        const doc = new Document({
          sections: [
            {
              children: text
                .split("\n")
                .map((line) => new Paragraph({ text: line || " " })),
            },
          ],
        });

        outputBuffer = await Packer.toBuffer(doc);
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else if (sourceExtension === "pdf" && targetFormat === "txt") {
        const pdfParser = require("pdf-parse-fork");
        const pdfData = await pdfParser(sourceBuffer);
        outputBuffer = Buffer.from(pdfData.text || "", "utf-8");
        contentType = "text/plain";
      }
      // --- Category 4: TXT to PDF ---
      else if (sourceExtension === "txt" && targetFormat === "pdf") {
        const text = sourceBuffer.toString("utf-8");
        outputBuffer = await textToPdf(text, outputName);
        contentType = "application/pdf";
      }
      // --- Category 5: Spreadsheet Conversions (Excel / CSV) ---
      else if (
        (sourceExtension === "xlsx" || sourceExtension === "xls") &&
        targetFormat === "csv"
      ) {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(sourceBuffer, { type: "buffer" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!firstSheet) {
          throw new Error("Excel sheet is empty or invalid.");
        }
        const csvText = XLSX.utils.sheet_to_csv(firstSheet);
        outputBuffer = Buffer.from(csvText, "utf-8");
        contentType = "text/csv";
      } else if (sourceExtension === "csv" && targetFormat === "xlsx") {
        const XLSX = await import("xlsx");
        const csvText = sourceBuffer.toString("utf-8");
        const workbook = XLSX.read(csvText, { type: "string" });
        outputBuffer = XLSX.write(workbook, {
          type: "buffer",
          bookType: "xlsx",
        });
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      }
      // --- Fallback / Unsupported ---
      else {
        throw new Error(
          `Conversion from ${sourceExtension.toUpperCase()} to ${targetFormat.toUpperCase()} is not supported.`,
        );
      }

      // Upload the converted file buffer
      const uploadResult = await serverFileStorage.upload(outputBuffer, {
        filename: outputFilename,
        contentType,
      });

      logger.info(
        `File Converter: Successful conversion uploaded to ${uploadResult.sourceUrl}`,
      );

      return {
        success: true,
        sourceFilename: originalFilename,
        sourceType: sourceExtension,
        targetFilename: outputFilename,
        targetType: targetFormat,
        downloadUrl: uploadResult.sourceUrl,
        size: outputBuffer.length,
        guide: `Successfully converted "${originalFilename}" into "${outputFilename}". You can download it using the link below.`,
      };
    } catch (error) {
      logger.error(`File Converter error during conversion:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
