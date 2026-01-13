import { tool as createTool } from "ai";
import { z } from "zod";

export const videoPlayerTool = createTool({
  name: "video-player",
  description:
    "Open a YouTube video in a dedicated small screen player using OpenTube proxy. Use this when the user shares a video link or asks to play/watch a video.",
  inputSchema: z.object({
    url: z.string().describe("The YouTube video URL to play"),
  }),
  execute: ({ url }) => {
    try {
      let videoId = "";
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0];
      } else if (url.includes("youtube.com/shorts/")) {
        videoId = url.split("youtube.com/shorts/")[1]?.split("?")[0];
      } else if (url.includes("v=")) {
        const urlParams = new URL(url).searchParams;
        videoId = urlParams.get("v") || "";
      } else if (url.length === 11) {
        videoId = url;
      }

      if (!videoId) {
        return { success: false, error: "Invalid YouTube URL" };
      }

      const openTubeUrl = `https://opentubee.vercel.app/watch?v=${videoId}`;
      return {
        success: true,
        videoId,
        openTubeUrl,
        message: `Opening video ${videoId} in OpenTube.`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
