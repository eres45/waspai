import { NextRequest } from "next/server";
import logger from "logger";

const TTS_WORKER_URL = "https://tts-worker.llamai.workers.dev/v1/audio/speech";

const SARVAM_VOICE_LANGS: Record<string, string> = {
  shubh: "hi-IN",
  bulbul: "hi-IN",
  aswarth: "te-IN",
  karthik: "ta-IN",
  deepika: "kn-IN",
  lata: "mr-IN",
};

/**
 * TTS API Proxy – LLAMAI TTS Worker (OpenAI-compatible) or Sarvam AI
 * Streams raw MP3 audio back to the client to avoid CORS issues.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = "en-US-JennyNeural" } = body;

    if (!text || typeof text !== "string") {
      return Response.json(
        { success: false, error: "Text is required and must be a string" },
        { status: 400 },
      );
    }

    // Intercept Sarvam AI voice requests
    if (voice && typeof voice === "string" && voice.startsWith("sarvam-")) {
      if (!process.env.SARVAM_API_KEY) {
        logger.error("SARVAM_API_KEY is not configured in the environment.");
        return Response.json(
          { success: false, error: "Sarvam voice key not configured" },
          { status: 503 },
        );
      }

      const speaker = voice.substring(7); // strip "sarvam-"
      const targetLang = SARVAM_VOICE_LANGS[speaker] || "en-IN";

      logger.info(
        `Sarvam TTS: speaker=${speaker}, lang=${targetLang}, text="${text.substring(0, 60)}..."`,
      );

      const sarvamResponse = await fetch(
        "https://api.sarvam.ai/text-to-speech",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-subscription-key": process.env.SARVAM_API_KEY,
          },
          body: JSON.stringify({
            text: text.trim(),
            target_language_code: targetLang,
            speaker,
            model: "bulbul:v3",
          }),
        },
      );

      if (!sarvamResponse.ok) {
        const err = await sarvamResponse.text();
        logger.error(`Sarvam TTS error ${sarvamResponse.status}: ${err}`);
        return Response.json(
          {
            success: false,
            error: `Sarvam TTS provider error: ${sarvamResponse.status}`,
          },
          { status: 502 },
        );
      }

      const resData = await sarvamResponse.json();
      const base64Data = resData.audios?.[0];
      if (!base64Data) {
        logger.error("No audio data returned in Sarvam response");
        return Response.json(
          { success: false, error: "No audio data returned from Sarvam" },
          { status: 502 },
        );
      }

      const audioBuffer = Buffer.from(base64Data, "base64");
      logger.info(
        `Sarvam TTS success: ${audioBuffer.byteLength} bytes returned`,
      );

      return new Response(audioBuffer, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-store",
        },
      });
    }

    // Map common names to the new worker voices if needed
    let targetVoice = "en-US-JennyNeural";
    const maleVoices = [
      "echo",
      "onyx",
      "fable",
      "verse",
      "ash",
      "ballad",
      "en-US-GuyNeural",
    ];
    const femaleVoices = [
      "nova",
      "shimmer",
      "alloy",
      "sage",
      "coral",
      "en-US-JennyNeural",
    ];

    if (voice && typeof voice === "string") {
      if (maleVoices.includes(voice)) {
        targetVoice = "en-US-GuyNeural";
      } else if (femaleVoices.includes(voice)) {
        targetVoice = "en-US-JennyNeural";
      }
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
