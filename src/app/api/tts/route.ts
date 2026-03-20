import { NextRequest } from "next/server";
import logger from "logger";

const TTS_WORKER_URL = "https://tts-worker.llamai.workers.dev/v1/audio/speech";

/**
 * TTS API Proxy – LLAMAI TTS Worker (OpenAI-compatible)
 * Streams raw MP3 audio back to the client to avoid CORS issues.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = "en-US-JennyNeural" } = body;

    // Map common names to the new worker voices if needed
    let targetVoice = voice;
    if (["nova", "shimmer", "alloy"].includes(voice)) {
      targetVoice = "en-US-JennyNeural";
    } else if (["echo", "onyx", "fable"].includes(voice)) {
      targetVoice = "en-US-GuyNeural";
    }

    if (!text || typeof text !== "string") {
      return Response.json(
        { success: false, error: "Text is required and must be a string" },
        { status: 400 },
      );
    }

    logger.info(
      `LLAMAI TTS: voice=${targetVoice}, text="${text.substring(0, 60)}..."`,
    );

    const ttsResponse = await fetch(TTS_WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer abc",
      },
      body: JSON.stringify({
        input: text.trim(),
        voice: targetVoice,
        model: "tts-1",
      }),
    });

    if (!ttsResponse.ok) {
      const err = await ttsResponse.text();
      logger.error(`LLAMAI TTS error ${ttsResponse.status}: ${err}`);
      return Response.json(
        { success: false, error: `TTS provider error: ${ttsResponse.status}` },
        { status: 502 },
      );
    }

    // Stream the raw audio bytes back to the browser
    const audioBuffer = await ttsResponse.arrayBuffer();

    logger.info(`LLAMAI TTS success: ${audioBuffer.byteLength} bytes returned`);

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
