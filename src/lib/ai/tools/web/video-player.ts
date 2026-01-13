import { tool as createTool } from "ai";
import { z } from "zod";

export const videoPlayerTool = createTool({
  name: "video-player",
  description:
    "**IMPORTANT: use 'search_web' FIRST to find a YouTube URL.** This tool ONLY plays specific YouTube videos given a direct URL. It cannot search. Once you have a URL from your search, use this tool to play it and automatically fetch its transcript.",
  inputSchema: z.object({
    url: z.string().describe("The specific YouTube video URL to play."),
  }),
  execute: async ({ url }) => {
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
