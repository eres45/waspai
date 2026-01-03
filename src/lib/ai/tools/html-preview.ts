import { tool as createTool } from "ai";
import { z } from "zod";

/**
 * HTML Preview Tool
 * Displays HTML/CSS/JS code in an interactive iframe preview
 */
export const htmlPreviewTool = createTool({
  name: "html_preview",
  description:
    "Display HTML, CSS, or JavaScript code with an interactive visual preview. Use this when generating web pages, calculators, forms, games, or any interactive UI. The code will be rendered in a sandboxed iframe allowing users to interact with it.",
  inputSchema: z.object({
    code: z
      .string()
      .describe(
        "The complete HTML/CSS/JS code to preview. For HTML, include inline CSS in <style> tags and inline JS in <script> tags for a complete standalone page.",
      ),
    fileType: z
      .enum(["html", "css", "js"])
      .default("html")
      .describe("The type of code file being previewed"),
  }),
  execute: ({ code, fileType }) => {
    return {
      code,
      fileType,
      success: true,
    };
  },
});
