import { tool as createTool } from "ai";
import z from "zod";

export type VideoGenToolResult = {
  video: {
    url: string;
    mimeType?: string;
  };
  guide?: string;
  queueInfo?: {
    position: number;
    estimatedWaitSeconds: number;
    totalInQueue: number;
    isGeneratingNow?: boolean;
  };
};

export const videoGenTool = createTool({
  description:
    "Generate a video based on a text prompt using Meta AI. (Currently disabled for maintenance)",
  inputSchema: z.object({
    prompt: z
      .string()
      .describe("Detailed description of the video to generate"),
    model: z
      .string()
      .optional()
      .describe(
        "Video generation model to use. Options: sora, sora-cinematic, sora-anime. Fallback to sora if not specified.",
      ),
  }),
  execute: async () => {
    return {
      video: {
        url: "",
      },
      guide:
        "AI Video Generation is currently disabled while upgrading upstream video models.",
    };
  },
});
