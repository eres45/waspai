import { NextRequest } from "next/server";
import logger from "logger";

const EDGE_TTS_URL = "https://edge-tts.llamai.workers.dev/v1/audio/speech";

/**
 * TTS API Proxy – Free Edge TTS (OpenAI-compatible)
 * Streams high-quality Microsoft Edge neural voices back to the client.
 *
 * Voice mapping (Edge provider):
 *   alloy, nova, shimmer → Female Neural
 *   echo, onyx, fable    → Male Neural
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = "nova" } = body;

    if (!text || typeof text !== "string") {
      return Response.json(
        { success: false, error: "Text is required and must be a string" },
        { status: 400 },
      );
    }

    logger.info(`Edge TTS: voice=${voice}, text="${text.substring(0, 60)}..."`);

    const ttsResponse = await fetch(EDGE_TTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: text.trim(), voice }),
    });

    if (!ttsResponse.ok) {
      const err = await ttsResponse.text();
      logger.error(`Edge TTS error ${ttsResponse.status}: ${err}`);
      return Response.json(
        { success: false, error: `TTS provider error: ${ttsResponse.status}` },
        { status: 502 },
      );
    }

    // Stream the raw audio bytes back to the browser
    const audioBuffer = await ttsResponse.arrayBuffer();

    logger.info(`Edge TTS success: ${audioBuffer.byteLength} bytes returned`);

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logger.error(`TTS proxy error: ${error}`);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
