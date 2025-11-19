import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";
import { serverFileStorage } from "lib/file-storage";

/**
 * Word Document Generator Tool
 * Creates .docx files from text content
 */
export const wordDocumentTool = createTool({
  name: "generate-word-document",
  description:
    "Generate a Word document (.docx) from text content. Returns a downloadable link to the generated document.",
  inputSchema: z.object({
    title: z.string().describe("Title of the document"),
    content: z.string().describe("The text content to include in the document"),
    filename: z
      .string()
      .optional()
      .describe("Optional filename (without .docx extension)"),
  }),
  execute: async (
    { title, content, filename },
    { abortSignal: _abortSignal },
  ) => {
    logger.info(
      `Word Document Generator: Creating document with title: "${title}"`,
    );

    try {
      // Import docx library dynamically
      const { Document, Packer, Paragraph, HeadingLevel } = await import(
        "docx"
      );

      // Create document with proper structure
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                text: `Generated on ${new Date().toLocaleString()}`,
                spacing: { after: 400 },
              }),
              ...content.split("\n").map(
                (line) =>
                  new Paragraph({
                    text: line || " ",
                    spacing: { line: 360, after: 200 },
                  }),
              ),
            ],
          },
        ],
      });

      // Generate document buffer
      const buffer = await Packer.toBuffer(doc);

      logger.info(
        `Word Document Generator: Document created, size: ${buffer.length} bytes`,
      );

      // Upload to storage
      const docFilename =
        filename && !filename.endsWith(".docx")
          ? `${filename}.docx`
          : filename || `document-${Date.now()}.docx`;

      const uploadResult = await serverFileStorage.upload(buffer, {
        filename: docFilename,
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      logger.info(
        `Word Document Generator: Document uploaded to ${uploadResult.sourceUrl}`,
      );

      return {
        success: true,
        downloadUrl: uploadResult.sourceUrl,
        filename: docFilename,
        size: buffer.length,
        guide: `Word document "${title}" has been generated successfully. You can download it using the link above.`,
      };
    } catch (error) {
      logger.error("Word Document Generator Error:", error);
      throw error;
    }
  },
});

/**
 * CSV/Excel Generator Tool
 * Creates .csv files from structured data
 */
export const csvGeneratorTool = createTool({
  name: "generate-csv",
  description:
    "Generate a CSV file from tabular data. Accepts either raw CSV text or structured data. Returns a downloadable link.",
  inputSchema: z.object({
    title: z.string().describe("Title/name of the CSV file"),
    content: z
      .string()
      .describe("CSV content (comma-separated values with newlines)"),
    filename: z
      .string()
      .optional()
      .describe("Optional filename (without .csv extension)"),
  }),
  execute: async (
    { title, content, filename },
    { abortSignal: _abortSignal },
  ) => {
    logger.info(`CSV Generator: Creating CSV with title: "${title}"`);

    try {
      // Ensure content ends with newline for proper CSV format
      const csvContent = content.trim().endsWith("\n")
        ? content
        : content + "\n";
      const buffer = Buffer.from(csvContent, "utf-8");

      logger.info(`CSV Generator: CSV created, size: ${buffer.length} bytes`);

      // Upload to storage
      const csvFilename =
        filename && !filename.endsWith(".csv")
          ? `${filename}.csv`
          : filename || `data-${Date.now()}.csv`;

      const uploadResult = await serverFileStorage.upload(buffer, {
        filename: csvFilename,
        contentType: "text/csv",
      });

      logger.info(`CSV Generator: CSV uploaded to ${uploadResult.sourceUrl}`);

      return {
        success: true,
        downloadUrl: uploadResult.sourceUrl,
        filename: csvFilename,
        size: buffer.length,
        guide: `CSV file "${title}" has been generated successfully. You can download it using the link above.`,
      };
    } catch (error) {
      logger.error("CSV Generator Error:", error);
      throw error;
    }
  },
});

/**
 * Text File Generator Tool
 * Creates .txt files from text content
 */
export const textFileTool = createTool({
  name: "generate-text-file",
  description:
    "Generate a plain text file (.txt) from content. Returns a downloadable link.",
  inputSchema: z.object({
    title: z.string().describe("Title/name of the text file"),
    content: z.string().describe("The text content to include"),
    filename: z
      .string()
      .optional()
      .describe("Optional filename (without .txt extension)"),
  }),
  execute: async (
    { title, content, filename },
    { abortSignal: _abortSignal },
  ) => {
    logger.info(
      `Text File Generator: Creating text file with title: "${title}"`,
    );

    try {
      // Create formatted text content
      const textContent = `${title}\n${"=".repeat(title.length)}\n\nGenerated on ${new Date().toLocaleString()}\n\n${content}`;
      const buffer = Buffer.from(textContent, "utf-8");

      logger.info(
        `Text File Generator: Text file created, size: ${buffer.length} bytes`,
      );

      // Upload to storage
      const txtFilename =
        filename && !filename.endsWith(".txt")
          ? `${filename}.txt`
          : filename || `document-${Date.now()}.txt`;

      const uploadResult = await serverFileStorage.upload(buffer, {
        filename: txtFilename,
        contentType: "text/plain",
      });

      logger.info(
        `Text File Generator: Text file uploaded to ${uploadResult.sourceUrl}`,
      );

      return {
        success: true,
        downloadUrl: uploadResult.sourceUrl,
        filename: txtFilename,
        size: buffer.length,
        guide: `Text file "${title}" has been generated successfully. You can download it using the link above.`,
      };
    } catch (error) {
      logger.error("Text File Generator Error:", error);
      throw error;
    }
  },
});
