import { tool as createTool } from "ai";
import { z } from "zod";
import { YoutubeTranscript } from "youtube-transcript";

export const youtubeTranscriptTool = createTool({
  name: "get-youtube-transcript",
  description:
    "Get the transcript/captions of a YouTube video to summarize or answer questions about it.",
  inputSchema: z.object({
    url: z.string().describe("The URL of the YouTube video"),
  }),
  execute: async ({ url }) => {
    try {
      // 1. Fetch transcript
      const transcriptItems = await YoutubeTranscript.fetchTranscript(url);

      if (!transcriptItems || transcriptItems.length === 0) {
        return "No transcript found for this video. Captions might be disabled.";
      }

      // 2. Enforce 30-minute limit (Approximate)
      // We check the 'offset' (start time in seconds) of the last item.
      // 30 mins = 1800 seconds.
      const lastItem = transcriptItems[transcriptItems.length - 1];
      const videoDurationSeconds = lastItem.offset + lastItem.duration;

      if (videoDurationSeconds > 1800) {
        return "This video is longer than 30 minutes. The free plan only supports videos up to 30 minutes. Please upgrade to Premium for unlimited access.";
      }

      // 3. Combine text
      const fullText = transcriptItems.map((item) => item.text).join(" ");

      // Limit text length just in case (e.g. fast talkers) to avoid context overflow
      // 30 mins of speaking is roughly 4000-6000 words.
      return fullText.slice(0, 25000); // ~5000-6000 words safe limit
    } catch (error: any) {
      console.error("YouTube Transcript Error:", error);
      if (error.toString().includes("Transcript is disabled")) {
        return "Transcripts are disabled for this video.";
      }
      return `Failed to fetch transcript: ${error.message || "Unknown error"}`;
    }
  },
});
