import { NextRequest } from "next/server";
import logger from "logger";

const LOVO_TTS_URL = "https://lovo-tts.llamai.workers.dev/v1/audio/speech";

/**
 * TTS API Proxy – LOVO TTS Worker (OpenAI-compatible)
 * Streams raw MP3 audio back to the client to avoid CORS issues.
 *
 * Voice mapping (LOVO worker):
 *   alloy, nova, shimmer → Chloe (Female US)
 *   echo, onyx, fable    → Thomas (Male US)
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

    logger.info(`LOVO TTS: voice=${voice}, text="${text.substring(0, 60)}..."`);

    const lovoResponse = await fetch(LOVO_TTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: text.trim(), voice }),
    });

    if (!lovoResponse.ok) {
      const err = await lovoResponse.text();
      logger.error(`LOVO TTS error ${lovoResponse.status}: ${err}`);
      return Response.json(
        { success: false, error: `TTS provider error: ${lovoResponse.status}` },
        { status: 502 },
      );
    }

    // Stream the raw audio bytes back to the browser
    const audioBuffer = await lovoResponse.arrayBuffer();

    logger.info(`LOVO TTS success: ${audioBuffer.byteLength} bytes returned`);

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
