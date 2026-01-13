import { tool as createTool } from "ai";
import { z } from "zod";

export const videoPlayerTool = createTool({
  name: "video-player",
  description:
    "Play a specific YouTube video or search for one. This tool handles EVERYTHING: it searches, plays the video in the UI, and fetches transcripts internally. You do NOT need to do anything else. Input: 'url' OR 'searchQuery'.",
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
      let videoId = "";
      let title = "";

      // 1. Handle Native Search
      if (searchQuery && !url) {
        const instances = ["https://y.com.sb"];

        let searchSuccess = false;

        for (const instance of instances) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const searchRes = await fetch(
              `${instance}/api/v1/search?q=${encodeURIComponent(searchQuery)}&type=video`,
              { signal: controller.signal },
            );
            clearTimeout(timeoutId);

            if (searchRes.ok) {
              const searchResults = await searchRes.json();
              if (searchResults && searchResults.length > 0) {
                const firstVideo = searchResults[0];
                videoId = firstVideo.videoId;
                title = firstVideo.title;
                searchSuccess = true;
                break; // Found it!
              }
            }
          } catch (e) {
            console.error(`Failed to search on ${instance}:`, e);
            // Continue to next instance
          }
        }

        if (!searchSuccess) {
          return {
            success: false,
            error: `Could not find any videos for "${searchQuery}" after trying multiple sources. Please try a specific URL.`,
          };
        }
      }

      // 2. Handle Direct URL (if no videoId from search)
      if (!videoId && url) {
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
      }

      if (!videoId) {
        return {
          success: false,
          error:
            "Please provide a valid 'url' or 'searchQuery' to find a video.",
        };
      }

      // Use the user's OpenTube app. The frontend component will handle the search via postMessage.
      const openTubeUrl = `https://opentubee.vercel.app`;

      // Auto-fetch transcript
      let transcriptSummary: string | null = null;
      try {
        // Use the URL if we have it, otherwise reconstruct a standard YouTube URL for the transcript tool
        const transcriptUrl =
          url || `https://www.youtube.com/watch?v=${videoId}`;
        const transcriptRes = await fetch(
          `https://socialdown.itz-ashlynn.workers.dev/yt-trans?url=${encodeURIComponent(transcriptUrl)}`,
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

      const successMessage = title
        ? `Playing "${title}" (ID: ${videoId}).`
        : `Playing video ${videoId}.`;

      return {
        success: true,
        mode: "video",
        videoId,
        openTubeUrl,
        transcriptSummary,
        message: transcriptSummary
          ? `${successMessage} Video is about: ${transcriptSummary.substring(0, 150)}...`
          : `${successMessage} Playing in OpenTube.`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
