import { tool as createTool } from "ai";
import { z } from "zod";

export const youtubeTranscriptTool = createTool({
  name: "get-youtube-transcript",
  description:
    "Get the transcript/captions of a YouTube video to summarize or answer questions about it.",
  inputSchema: z.object({
    url: z.string().describe("The URL of the YouTube video"),
  }),
  execute: async ({ url }) => {
    try {
      // console.log(`[YouTube Tool] Fetching transcript via SocialDown for: ${url}`);

      const res = await fetch(
        `https://socialdown.itz-ashlynn.workers.dev/yt-trans?url=${encodeURIComponent(url)}`,
      );

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();

      if (!data.success || !data.transcript) {
        return (
          data.error ||
          "Could not retrieve transcript for this video. It might be age-restricted, private, or have captions disabled."
        );
      }

      // Return the transcript (limited to 25k chars for token safety)
      return data.transcript.slice(0, 25000);
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("YouTube Transcript Error:", error);
      return `Failed to fetch transcript: ${error.message || "Unknown error"}. This might be due to a temporary service interruption.`;
    }
  },
});
