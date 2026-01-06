import { tool as createTool } from "ai";
import { z } from "zod";
// Deep import to avoid CLI side-effects
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { YouTubeTranscriptApi } from "@playzone/youtube-transcript/dist/api/index.js";

export const youtubeTranscriptTool = createTool({
  name: "get-youtube-transcript",
  description:
    "Get the transcript/captions of a YouTube video to summarize or answer questions about it.",
  inputSchema: z.object({
    url: z.string().describe("The URL of the YouTube video"),
  }),
  execute: async ({ url }) => {
    try {
      // 1. URL Normalization
      let videoId = "";

      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0];
      } else if (url.includes("youtube.com/shorts/")) {
        videoId = url.split("youtube.com/shorts/")[1]?.split("?")[0];
      } else if (url.includes("v=")) {
        const urlParams = new URL(url).searchParams;
        videoId = urlParams.get("v") || "";
      } else {
        // If it looks like a ID, use it
        if (url.length === 11) videoId = url;
        else return "Invalid YouTube URL format.";
      }

      // console.log(`[YouTube Tool] Fetching transcript for: ${videoId}`);

      // 2. Fetch transcript using @playzone/youtube-transcript
      // Note: Library uses its own fetch with limited customization
      // YouTube blocks Vercel IPs aggressively - works locally but may fail on serverless
      const api = new YouTubeTranscriptApi();
      const transcriptList = await api.list(videoId);

      // Try to find English or English (Auto)
      // The library's findTranscript helper is robust
      const transcript = transcriptList.findTranscript(["en", "en-US"]);

      if (!transcript) {
        return "No English transcript found for this video.";
      }

      const result = await transcript.fetch();

      // result is { snippets: [ { text, start, duration } ], ... }
      if (!result.snippets || result.snippets.length === 0) {
        return "Transcript was found but contained no text.";
      }

      // 3. Enforce 30-minute limit
      // Check the start time + duration of the last snippet
      const lastSnippet = result.snippets[result.snippets.length - 1];
      const durationSeconds = lastSnippet.start + lastSnippet.duration;

      if (durationSeconds > 1800) {
        return "This video is longer than 30 minutes. The free plan only supports videos up to 30 minutes. Please upgrade to Premium for unlimited access.";
      }

      // 4. Combine text
      const fullText = result.snippets.map((s: any) => s.text).join(" ");

      // Decode HTML entities (the library might leave them)
      // We can use a simple replace for common ones or just return as is (LLMs handle it fine)
      const cleanText = fullText
        .replace(/&amp;#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"');

      return cleanText.slice(0, 25000);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error("YouTube Transcript Error:", error);

      const err = error as any;

      // Check for bot detection / IP blocking
      if (
        err.message?.includes("Sign in") ||
        err.message?.includes("not a bot") ||
        err.reason?.includes("not a bot")
      ) {
        return `YouTube is currently blocking transcript requests from this server due to bot detection. This is a temporary issue with YouTube's anti-scraping protection.

Alternatives:
1. Try a different video (some work, some don't depending on YouTube's current blocking)
2. Use a video summary service like you-tldr.com and paste the summary
3. Manually enable captions on YouTube and copy/paste the key points you'd like me to analyze

I apologize for the inconvenience - this is a YouTube limitation, not an issue with the tool itself.`;
      }

      if (err.message && err.message.includes("is disabled")) {
        return "Transcripts are disabled for this video.";
      }
      if (err.message && err.message.includes("Could not retrieve")) {
        // Generic library error
        return "Could not retrieve transcript. The video might not have captions or is age-restricted.";
      }

      return `Failed to fetch transcript: ${err.message || "Unknown error"}`;
    }
  },
});
