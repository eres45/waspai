import { NextRequest } from "next/server";
import logger from "logger";

const FISH_AUDIO_API_URL = "https://api.fish.audio/v1/tts";
const FISH_AUDIO_API_KEY =
  process.env.FISH_AUDIO_API_KEY ||
  "sk-fish-YM7VRAWHIe1H7PmrYEgOAP6SnZZImkY9kPj0SxGvbO0";

// Primary Female Voice (Sweet, conversational, friendly assistant)
const FISH_FEMALE_VOICE_ID = "f7f74a4bc4324c25b96b9b6741a72ab3";

// Secondary / Male Voice
const FISH_MALE_VOICE_ID = "3b480f554a5b4ab9a6bc62d6ebd7c98a";

const TTS_WORKER_FALLBACK_URL =
  "https://tts-worker.llamai.workers.dev/v1/audio/speech";

const SARVAM_VOICE_LANGS: Record<string, string> = {
  shubh: "hi-IN",
  bulbul: "hi-IN",
  aswarth: "te-IN",
  karthik: "ta-IN",
  deepika: "kn-IN",
  lata: "mr-IN",
};

const MALE_VOICES = new Set([
  "echo",
  "onyx",
  "fable",
  "verse",
  "ash",
  "ballad",
  "en-US-GuyNeural",
  "fish-male",
]);

/**
 * TTS API Proxy – Primary: Fish Audio (s2.1-pro-free, streaming female voice)
 * Fallbacks: Sarvam AI (Indic voices) or LLAMAI TTS Worker
 * Streams raw MP3 audio directly to the client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = "fish-female" } = body;

    if (!text || typeof text !== "string") {
      return Response.json(
        { success: false, error: "Text is required and must be a string" },
        { status: 400 },
      );
    }

    const cleanText = text.trim();

    // ── 1. Intercept Sarvam AI voice requests ──────────────────────────────────
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
        `Sarvam TTS: speaker=${speaker}, lang=${targetLang}, text="${cleanText.substring(0, 60)}..."`,
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
            text: cleanText,
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

    // ── 2. Primary: Fish Audio (s2.1-pro-free with streaming) ─────────────────
    const isMale = typeof voice === "string" && MALE_VOICES.has(voice);
    const referenceId = isMale ? FISH_MALE_VOICE_ID : FISH_FEMALE_VOICE_ID;
    const selectedGender = isMale ? "male" : "female";

    logger.info(
      `Fish Audio TTS [s2.1-pro-free]: gender=${selectedGender}, voice=${voice}, text="${cleanText.substring(0, 60)}..."`,
    );

    try {
      const fishResponse = await fetch(FISH_AUDIO_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FISH_AUDIO_API_KEY}`,
          "Content-Type": "application/json",
          model: "s2.1-pro-free",
        },
        body: JSON.stringify({
          text: cleanText,
          reference_id: referenceId,
          format: "mp3",
        }),
      });

      if (fishResponse.ok && fishResponse.body) {
        logger.info(`Fish Audio TTS stream connected successfully`);
        return new Response(fishResponse.body, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Transfer-Encoding": "chunked",
            "Cache-Control": "no-cache",
          },
        });
      }

      const fishErr = await fishResponse.text().catch(() => "");
      logger.warn(
        `Fish Audio TTS warning ${fishResponse.status}: ${fishErr.substring(0, 150)}, trying fallback...`,
      );
    } catch (fishError) {
      logger.warn(`Fish Audio fetch failed, routing to fallback:`, fishError);
    }

    // ── 3. Secondary Fallback: LLAMAI TTS Worker ──────────────────────────────
    const fallbackVoice = isMale ? "en-US-GuyNeural" : "en-US-JennyNeural";
    logger.info(`Routing to fallback TTS Worker: voice=${fallbackVoice}`);

    const fallbackResponse = await fetch(TTS_WORKER_FALLBACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer abc",
      },
      body: JSON.stringify({
        input: cleanText,
        voice: fallbackVoice,
        model: "tts-1",
      }),
    });

    if (!fallbackResponse.ok) {
      const err = await fallbackResponse.text();
      logger.error(`Fallback TTS error ${fallbackResponse.status}: ${err}`);
      return Response.json(
        {
          success: false,
          error: `TTS provider error: ${fallbackResponse.status}`,
        },
        { status: 502 },
      );
    }

    return new Response(fallbackResponse.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
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
