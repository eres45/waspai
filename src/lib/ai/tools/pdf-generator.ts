import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";

/**
 * PDF Generator Tool
 * Generates PDFs from text content and provides download links
 * Uses jsPDF for serverless-friendly PDF generation
 */
/**
 * PDF Generator Tool
 * This tool now returns a structured JSON object.
 * The frontend (DocumentGeneratorToolInvocation) handles rendering and PDF export via html2pdf.js.
 */
export const pdfGeneratorTool = createTool({
  name: "generate-pdf",
  description:
    "Generate a professional PDF document with a cover page, summary, and nested sections. Returns a structured document layout for the UI to render and export.",
  inputSchema: z.object({
    title: z.string().describe("The main title of the document"),
    description: z
      .string()
      .describe("A brief description or subtitle for the cover page"),
    summary: z
      .string()
      .optional()
      .describe("A high-level summary or 'Key Takeaways' box"),
    theme: z
      .enum(["executive", "modern", "minimal", "midnight", "professional"])
      .default("executive")
      .describe("The visual style of the document"),
    primaryColor: z
      .string()
      .optional()
      .describe("Primary accent color (HEX, e.g. #f97316 for orange)"),
    secondaryColor: z
      .string()
      .optional()
      .describe("Secondary accent color (HEX)"),
    layout: z
      .enum(["standard", "compact", "spaced"])
      .default("standard")
      .describe("The spacing and layout style"),
    sections: z
      .array(
        z.object({
          heading: z.string().describe("The section heading"),
          content: z.string().describe("The main content of the section"),
          subsections: z
            .array(
              z.object({
                title: z.string().optional().describe("Subsection title"),
                text: z.string().describe("Subsection content"),
              }),
            )
            .optional(),
        }),
      )
      .describe("The main body sections of the document"),
    filename: z
      .string()
      .optional()
      .describe("Optional filename (without .pdf extension)"),
  }),
  execute: async ({
    title,
    description,
    summary,
    sections,
    filename,
    theme,
    primaryColor,
    secondaryColor,
    layout,
  }) => {
    logger.info(`PDF Generator: Preparing ${theme} document: "${title}"`);

    const pdfFilename =
      filename && !filename.endsWith(".pdf")
        ? `${filename}.pdf`
        : filename || `document-${Date.now()}.pdf`;

    return {
      success: true,
      title,
      description,
      summary,
      sections,
      theme,
      primaryColor,
      secondaryColor,
      layout,
      filename: pdfFilename,
      guide: `The document "${title}" has been created with the ${theme} theme. Access the preview and download below.`,
    };
  },
});
