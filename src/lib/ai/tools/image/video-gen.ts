import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";
import { generateVideoWithSora } from "lib/ai/image/video-gen";

export type VideoGenToolResult = {
  video: {
    url: string;
    mimeType?: string;
  };
  guide?: string;
};

/**
 * Video generation tool using SORA API
 */
export const videoGenTool = createTool({
  name: "video-gen",
  description:
    "Generate a video based on a text prompt using SORA. Provide a detailed description of the video you want to create.",
  inputSchema: z.object({
    prompt: z
      .string()
      .describe(
        "Detailed description of the video to generate (e.g., 'A cat playing with a ball in a sunny garden')",
      ),
  }),
  execute: async ({ prompt }, { abortSignal }) => {
    logger.info(`Video Gen tool called with prompt: "${prompt}"`);

    try {
      // Call the video generation API
      const generatedVideo = await generateVideoWithSora({
        prompt,
        abortSignal,
      });

      logger.info(`Video Gen: Video generated successfully`);

      return {
        video: generatedVideo.video,
        guide:
          generatedVideo.video.url.length > 0
            ? "Your video has been generated successfully! You can view it above."
            : "I apologize, but the video generation was not successful. Please try again with a different prompt.",
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
});
