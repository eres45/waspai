import { tool as createTool } from "ai";
import { z } from "zod";

export const videoPlayerTool = createTool({
  name: "video-player",
  description:
    "Search for YouTube videos or play a specific video using OpenTube. When playing a video, automatically fetches the transcript so you can understand what it's about. Use 'searchQuery' to search YouTube, or 'url' to play a specific video.",
  inputSchema: z.object({
    url: z
      .string()
      .optional()
      .describe("The YouTube video URL to play (optional if searching)"),
    searchQuery: z
      .string()
      .optional()
      .describe(
        "Search query for finding YouTube videos (optional if playing specific URL)",
      ),
  }),
  execute: async ({ url, searchQuery }) => {
    try {
      // Handle search query
      if (searchQuery) {
        const openTubeSearchUrl = `https://opentubee.vercel.app/results?search_query=${encodeURIComponent(searchQuery)}`;
        return {
          success: true,
          mode: "search",
          searchQuery,
          openTubeUrl: openTubeSearchUrl,
          message: `Searching YouTube for: "${searchQuery}"`,
        };
      }

      // Handle specific video playback
      if (!url) {
        return {
          success: false,
          error: "Either 'url' or 'searchQuery' must be provided",
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
      let transcriptSummary = null;
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
          ? `Playing video ${videoId}. Video is about: ${transcriptSummary.slice(0, 150)}...`
          : `Playing video ${videoId} in OpenTube.`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
