import { tool as createTool } from "ai";
import { z } from "zod";

const API_KEY = process.env.EXA_API_KEY;

const fetchExa = async (query: string): Promise<string | null> => {
  if (!API_KEY) return null;
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({
        query: `site:youtube.com ${query}`,
        numResults: 1,
        type: "keyword",
      }),
    });
    const data = await res.json();
    return data.results?.[0]?.url || null;
  } catch (_e) {
    return null;
  }
};

export const videoPlayerTool = createTool({
  name: "video-player",
  description:
    "Play a YouTube video. You can provide a specific 'url' OR a 'searchQuery'. If you provide a query, I will find and play the best match for you.",
  inputSchema: z.object({
    url: z.string().optional().describe("The specific YouTube video URL."),
    searchQuery: z
      .string()
      .optional()
      .describe("Topic to search for (e.g. 'cat videos')"),
  }),
  execute: async ({ url, searchQuery }) => {
    try {
      // 1. Internal Search (Smart Mode)
      if (!url && searchQuery) {
        const foundUrl = await fetchExa(searchQuery);
        if (foundUrl) {
          url = foundUrl; // Upgrade query to URL
        } else {
          return {
            success: false,
            error: `Could not find any YouTube videos for '${searchQuery}'. Please try a different query or find the URL yourself.`,
          };
        }
      }

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
          ? `Playing '${searchQuery || "video"}' (${videoId}). Content: ${transcriptSummary.substring(0, 150)}...`
          : `Playing video ${videoId} in OpenTube.`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
