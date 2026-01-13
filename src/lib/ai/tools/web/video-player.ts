import { tool as createTool } from "ai";
import { z } from "zod";

export const videoPlayerTool = createTool({
  name: "video-player",
  description:
    "Play a specific YouTube video or search for one. If you have a URL, use 'url'. If you only have a name (e.g. 'cat videos'), use 'searchQuery'. The tool will guide you to the content.",
  inputSchema: z.object({
    url: z
      .string()
      .optional()
      .describe("The specific YouTube video URL to play."),
    searchQuery: z
      .string()
      .optional()
      .describe("Topic or name of video to search for if URL is not known."),
  }),
  execute: async ({ url, searchQuery }) => {
    try {
      // 1. Handle Search Intent (Agent Redirect)
      if (searchQuery && !url) {
        return {
          success: false, // "False" to force the model to rethink/retry
          error: `To play '${searchQuery}', you must FIRST find the specific YouTube URL. Please use your 'webSearch' tool to find the best YouTube video URL for this query, then call this tool again with the specific 'url'.`,
          mode: "search_guidance",
        };
      }

      // 2. Handle Play Intent
      if (!url) {
        return {
          success: false,
          error: "Please provide a 'url' or 'searchQuery'.",
        };
      }

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

      // Auto-fetch transcript
      let transcriptSummary: string | null = null;
      try {
        const transcriptRes = await fetch(
          `https://socialdown.itz-ashlynn.workers.dev/yt-trans?url=${encodeURIComponent(url)}`,
        );
        if (transcriptRes.ok) {
          const transcriptData = await transcriptRes.json();
          if (transcriptData.success && transcriptData.transcript) {
            // Get first 500 chars as summary for the AI to understand context
            transcriptSummary = transcriptData.transcript.slice(0, 500);
          }
        }
      } catch (_e) {
        // Transcript fetch failed, but video player still works
      }

      return {
        success: true,
        mode: "video",
        videoId,
        openTubeUrl,
        transcriptSummary,
        message: transcriptSummary
          ? `Playing video ${videoId}. Video is about: ${transcriptSummary.substring(0, 150)}...`
          : `Playing video ${videoId} in OpenTube.`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
