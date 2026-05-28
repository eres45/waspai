import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";
import { extractTextFromImageViaAI, getImageData } from "@/lib/ocr/ocr-service";

export const analyzeImageTool = createTool({
  name: "analyze-image",
  description:
    "Analyze an image using a state-of-the-art vision model (Llama 4 Scout on Groq). Call this tool to describe the contents of an image, extract its text (OCR), or answer specific questions about visual inputs.",
  inputSchema: z.object({
    imageUrl: z
      .string()
      .describe(
        "The URL of the image to analyze. Can be a standard HTTP URL, a Telegram proxied URL (/api/storage/file/...), or a base64 Data URL (data:image/...)",
      ),
    prompt: z
      .string()
      .optional()
      .describe(
        "Specific question or instruction for the vision model (e.g. 'Identify the brand of the car', 'transcribe the handwriting'). If omitted, the model will provide a comprehensive detailed description and full text transcription.",
      ),
  }),
  execute: async ({ imageUrl, prompt }, { abortSignal: _abortSignal }) => {
    logger.info(
      `Vision Tool: Analyzing image from ${imageUrl.substring(0, 50)}...`,
    );

    try {
      const imageData = await getImageData(imageUrl);
      if (!imageData) {
        return {
          success: false,
          error:
            "Failed to download or parse image data from the provided URL.",
        };
      }

      const text = await extractTextFromImageViaAI(imageUrl, imageData, prompt);

      return {
        success: true,
        analysis: text,
        guide:
          "Successfully analyzed image using Groq Vision. Present this description/transcription to the user.",
      };
    } catch (error: any) {
      logger.error("Vision Tool Error:", error);
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  },
});
