/**
 * Client-Side YouTube Transcript Fetcher
 * Fetches YouTube transcripts in the browser using user's IP to bypass server-side blocking
 */

export interface YouTubeTranscriptSnippet {
  text: string;
  start: number;
  duration: number;
}

export interface YouTubeTranscriptResult {
  videoId: string;
  title?: string;
  transcript: string;
  snippets: YouTubeTranscriptSnippet[];
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

/**
 * Detect if a string contains a YouTube URL
 */
export function containsYouTubeUrl(text: string): boolean {
  return /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.test(
    text,
  );
}

/**
 * Extract all YouTube URLs from text
 */
export function extractYouTubeUrls(text: string): string[] {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s]*)?/g;
  const matches = text.match(regex);
  return matches || [];
}

/**
 * Fetch YouTube transcript using browser (client-side)
 * This bypasses Vercel IP blocking by using the user's residential IP
 */
export async function fetchYouTubeTranscript(
  videoId: string,
): Promise<YouTubeTranscriptResult> {
  try {
    // Step 1: Fetch video page to get caption track URL
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageResponse = await fetch(videoPageUrl);

    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch video page: ${pageResponse.status}`);
    }

    const pageHtml = await pageResponse.text();

    // Step 2: Extract video title
    const titleMatch = pageHtml.match(/<meta name="title" content="([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : undefined;

    // Step 3: Extract caption track URL from page HTML
    // Look for captionTracks in the embedded player config
    const captionTracksMatch = pageHtml.match(/"captionTracks":(\[.*?\])/);

    if (!captionTracksMatch) {
      throw new Error(
        "No captions found. Video may not have subtitles enabled.",
      );
    }

    const captionTracks = JSON.parse(captionTracksMatch[1]);

    // Find English caption track
    const englishTrack = captionTracks.find(
      (track: any) =>
        track.languageCode === "en" ||
        track.languageCode === "en-US" ||
        track.languageCode === "en-GB",
    );

    if (!englishTrack) {
      throw new Error("No English captions found for this video.");
    }

    // Step 4: Fetch the transcript XML
    const transcriptUrl = englishTrack.baseUrl;
    const transcriptResponse = await fetch(transcriptUrl);

    if (!transcriptResponse.ok) {
      throw new Error(
        `Failed to fetch transcript: ${transcriptResponse.status}`,
      );
    }

    const transcriptXml = await transcriptResponse.text();

    // Step 5: Parse XML to extract text snippets
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(transcriptXml, "text/xml");
    const textNodes = xmlDoc.getElementsByTagName("text");

    const snippets: YouTubeTranscriptSnippet[] = [];
    let fullTranscript = "";

    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i];
      const text = node.textContent || "";
      const start = parseFloat(node.getAttribute("start") || "0");
      const duration = parseFloat(node.getAttribute("dur") || "0");

      // Decode HTML entities
      const decodedText = text
        .replace(/&amp;#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'");

      snippets.push({
        text: decodedText,
        start,
        duration,
      });

      fullTranscript += decodedText + " ";
    }

    return {
      videoId,
      title,
      transcript: fullTranscript.trim(),
      snippets,
    };
  } catch (error) {
    console.error("[YouTube Client] Error fetching transcript:", error);
    throw error;
  }
}

/**
 * Fetch transcript from YouTube URL (convenience wrapper)
 */
export async function fetchTranscriptFromUrl(
  url: string,
): Promise<YouTubeTranscriptResult> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }
  return fetchYouTubeTranscript(videoId);
}
