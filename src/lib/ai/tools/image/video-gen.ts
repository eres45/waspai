import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";
import { generateVideoWithMeta } from "lib/ai/image/video-gen";

export type VideoGenToolResult = {
  video: {
    url: string;
    mimeType?: string;
  };
  guide?: string;
};

/**
 * Video generation tool using Meta AI API
 */
export const videoGenTool = createTool({
  name: "video-gen",
  description:
    "Generate a video based on a text prompt using Meta AI. Provide a detailed description of the video you want to create.",
  inputSchema: z.object({
    prompt: z
      .string()
      .describe(
        "Detailed description of the video to generate (e.g., 'A cat playing with a ball in a sunny garden')",
      ),
  }),
  execute: async ({ prompt }) => {
    try {
      logger.info(`Video Gen tool called with prompt: "${prompt}"`);

      // Call the video generation API
      // NOTE: We intentionally do NOT pass the AI SDK's abortSignal here.
      // The AI SDK fires abortSignal when the streaming response to the client ends,
      // which would cancel our fetch to Render mid-flight (~21-30s).
      // Instead, generateVideoWithMeta uses its own 120s AbortController timeout.
      const generatedVideo = await generateVideoWithMeta({
        prompt,
      });

      logger.info(`Video Gen: Video generated successfully`);

      const result = {
        video: generatedVideo.video,
        guide:
          generatedVideo.video.url.length > 0
            ? "Your video has been generated successfully! You can view it above."
            : "I apologize, but the video generation was not successful. Please try again with a different prompt.",
      };

      logger.info(`Video Gen: Returning result: ${JSON.stringify(result)}`);

      return result;
    } catch (e: any) {
      logger.error("Video Gen Tool Error:", e);
      return {
        video: { url: "" },
        guide: `Error generating video: ${e.message || "Unknown error"}. Please try again later.`,
      };
    }
  },
});
