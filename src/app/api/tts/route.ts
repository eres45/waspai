import { NextRequest } from "next/server";
import logger from "logger";
import { isWoinoVoice, resolveWoinoVoiceId } from "lib/ai/speech/woino-voices";

const FISH_AUDIO_API_URL = "https://api.fish.audio/v1/tts";
const DEFAULT_FISH_AUDIO_KEYS = [
  "sk-fish-YM7VRAWHIe1H7PmrYEgOAP6SnZZImkY9kPj0SxGvbO0",
  "sk-fish-XgGMqXw6-gp5Gb_EO2mVJsFKonQMi-Nyp8uwxvAL7DM",
];

function getFishAudioKeys(): string[] {
  const envKeys =
    process.env.FISH_AUDIO_API_KEY || process.env.FISH_AUDIO_API_KEYS;
  if (!envKeys) {
    return DEFAULT_FISH_AUDIO_KEYS;
  }
  const split = envKeys
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return split.length > 0 ? split : DEFAULT_FISH_AUDIO_KEYS;
}

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

const LLAMAI_VOICES = new Set([
  "nova",
  "alloy",
  "shimmer",
  "echo",
  "onyx",
  "fable",
  "en-US-JennyNeural",
  "en-US-GuyNeural",
]);

function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  return text
    .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
    .replace(/<thinking>[\s\S]*?(?:<\/thinking>|$)/gi, "")
    .replace(/<reasoning>[\s\S]*?(?:<\/reasoning>|$)/gi, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/^[ \t]*#{1,6}[ \t]*/gm, "")
    .replace(/^[ \t]*[>\-*+][ \t]+/gm, "")
    .replace(/^[ \t]*\d+\.[ \t]+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/\\\([\s\S]*?\\\)/g, "")
    .replace(/\\\[[\s\S]*?\\\]/g, "")
    .replace(/\$\$[\s\S]*?\$\$/g, "")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, ".")
    .trim();
}

/**
 * Custom fetch helper that enforces a fast connection/TTFB timeout (e.g. 10s)
 * so we can quickly failover if a provider is unresponsive, but allows the resulting
 * audio body stream up to streamTimeoutMs (e.g. 180s) to download without premature abortion.
 */
async function fetchWithConnectionTimeout(
  url: string,
  options: RequestInit,
  connectTimeoutMs: number = 10000,
  streamTimeoutMs: number = 180000,
): Promise<Response> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | null = setTimeout(() => {
    controller.abort(
      new Error(`Connection timed out after ${connectTimeoutMs}ms`),
    );
  }, connectTimeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    if (res.ok) {
      timer = setTimeout(() => {
        controller.abort(
          new Error(`Audio stream timed out after ${streamTimeoutMs}ms`),
        );
      }, streamTimeoutMs);
      if (timer.unref) timer.unref();
    }
    return res;
  } catch (err) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    throw err;
  }
}

/**
 * TTS API Proxy – Primary: Fish Audio / LLAMAI TTS Worker
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

    const cleanText = cleanTextForSpeech(text.trim());
    if (!cleanText) {
      return Response.json(
        { success: false, error: "Text contains no speakable content" },
        { status: 400 },
      );
    }

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

    // ── 2. Intercept Woino Neural voice requests ─────────────────────────────
    if (
      typeof voice === "string" &&
      (voice === "woino" || voice.startsWith("woino-") || isWoinoVoice(voice))
    ) {
      const woinoVoiceId = resolveWoinoVoiceId(voice);
      try {
        logger.info(
          `Woino Neural TTS: voice=${woinoVoiceId}, text="${cleanText.substring(0, 60)}..."`,
        );
        const woinoResponse = await fetchWithConnectionTimeout(
          "https://tts.woino.app/api/speech",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Origin: "https://tts.woino.app",
              Referer: "https://tts.woino.app/studio",
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
            },
            body: JSON.stringify({
              input: cleanText,
              model: "lightning_v3.1",
              voice: woinoVoiceId,
              response_format: "mp3",
              speed: 1,
            }),
          },
          10000,
          180000,
        );

        if (woinoResponse.ok && woinoResponse.body) {
          logger.info(`Woino TTS stream connected: voice=${woinoVoiceId}`);
          return new Response(woinoResponse.body, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Transfer-Encoding": "chunked",
              "Cache-Control": "no-cache",
            },
          });
        }

        const woinoErr = await woinoResponse.text().catch(() => "");
        logger.warn(
          `Woino TTS returned ${woinoResponse.status}: ${woinoErr.substring(0, 120)}. Continuing to fallback...`,
        );
      } catch (woinoErr) {
        logger.warn(
          `Woino TTS fetch error for voice=${woinoVoiceId}:`,
          woinoErr,
        );
      }
    }

    const isMale = typeof voice === "string" && MALE_VOICES.has(voice);
    const fallbackVoice = isMale ? "en-US-GuyNeural" : "en-US-JennyNeural";

    // ── 3. If voice is an OpenAI/Neural voice (e.g. nova, alloy, shimmer, echo, etc.), route directly to LLAMAI TTS ──
    if (typeof voice === "string" && LLAMAI_VOICES.has(voice)) {
      try {
        logger.info(`Routing directly to LLAMAI TTS: voice=${voice}`);
        const llamaiResponse = await fetchWithConnectionTimeout(
          TTS_WORKER_FALLBACK_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer abc",
            },
            body: JSON.stringify({
              input: cleanText,
              voice,
              model: "tts-1",
            }),
          },
          10000,
          180000,
        );

        if (llamaiResponse.ok && llamaiResponse.body) {
          logger.info(
            `LLAMAI TTS stream connected successfully for voice=${voice}`,
          );
          return new Response(llamaiResponse.body, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Transfer-Encoding": "chunked",
              "Cache-Control": "no-store",
            },
          });
        }
      } catch (llamaiErr) {
        logger.warn(`Primary LLAMAI TTS failed for voice=${voice}:`, llamaiErr);
      }
    }

    // ── 3. Primary for fish-* / Fallback for others: Fish Audio (with 10s connection timeout & key rotation) ──
    const referenceId = isMale ? FISH_MALE_VOICE_ID : FISH_FEMALE_VOICE_ID;
    const selectedGender = isMale ? "male" : "female";

    logger.info(
      `Fish Audio TTS [s2.1-pro-free]: gender=${selectedGender}, voice=${voice}, text="${cleanText.substring(0, 60)}..."`,
    );

    const fishKeys = getFishAudioKeys();
    for (const apiKey of fishKeys) {
      try {
        const fishResponse = await fetchWithConnectionTimeout(
          FISH_AUDIO_API_URL,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              model: "s2.1-pro-free",
            },
            body: JSON.stringify({
              text: cleanText,
              reference_id: referenceId,
              format: "mp3",
            }),
          },
          10000,
          180000,
        );

        if (fishResponse.ok && fishResponse.body) {
          logger.info(
            `Fish Audio TTS stream connected successfully with key ...${apiKey.slice(-6)}`,
          );
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
          `Fish Audio TTS key (...${apiKey.slice(-6)}) warning ${fishResponse.status}: ${fishErr.substring(0, 150)}, trying next key...`,
        );
      } catch (fishError) {
        logger.warn(
          `Fish Audio fetch failed for key (...${apiKey.slice(-6)}):`,
          fishError,
        );
      }
    }

    // ── 4. Fallback Chain: LLAMAI Worker → Sarvam Worker → Kitten TTS ───────
    const sarvamFallbackVoice = isMale ? "shubh" : "priya";
    const kittenFallbackVoice = isMale ? "Bruno" : "Bella";

    // 4a. Secondary Fallback: LLAMAI TTS Worker (with fallbackVoice)
    try {
      logger.info(`Routing to Fallback (LLAMAI TTS): voice=${fallbackVoice}`);
      const fallbackResponse = await fetchWithConnectionTimeout(
        TTS_WORKER_FALLBACK_URL,
        {
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
        },
        10000,
        180000,
      );

      if (fallbackResponse.ok && fallbackResponse.body) {
        return new Response(fallbackResponse.body, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Transfer-Encoding": "chunked",
            "Cache-Control": "no-store",
          },
        });
      }
    } catch (fb1Err) {
      logger.warn(`Fallback (LLAMAI) failed:`, fb1Err);
    }

    // 3b. Secondary Fallback: Sarvam Worker (odd-fog-3663)
    try {
      logger.info(
        `Routing to Fallback 2 (Sarvam Worker): voice=${sarvamFallbackVoice}`,
      );
      const sarvamFbRes = await fetchWithConnectionTimeout(
        "https://odd-fog-3663.mikemathews7000.workers.dev/v1/audio/speech",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "bulbul:v3",
            input: cleanText,
            voice: sarvamFallbackVoice,
          }),
        },
        5000,
        60000,
      );

      if (sarvamFbRes.ok && sarvamFbRes.body) {
        return new Response(sarvamFbRes.body, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Transfer-Encoding": "chunked",
            "Cache-Control": "no-store",
          },
        });
      }
    } catch (fb2Err) {
      logger.warn(`Fallback 2 (Sarvam Worker) failed:`, fb2Err);
    }

    // 3c. Tertiary Fallback: Kitten TTS (47.95.206.196)
    try {
      logger.info(
        `Routing to Fallback 3 (Kitten TTS): voice=${kittenFallbackVoice}`,
      );
      const kittenRes = await fetchWithConnectionTimeout(
        "http://47.95.206.196:8080/v1/audio/speech",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "kitten-tts",
            input: cleanText,
            voice: kittenFallbackVoice,
          }),
        },
        3000,
        60000,
      );

      if (kittenRes.ok && kittenRes.body) {
        return new Response(kittenRes.body, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Transfer-Encoding": "chunked",
            "Cache-Control": "no-store",
          },
        });
      }
    } catch (fb3Err) {
      logger.warn(`Fallback 3 (Kitten TTS) failed:`, fb3Err);
    }

    return Response.json(
      {
        success: false,
        error: "All TTS providers and fallbacks temporarily unavailable",
      },
      { status: 502 },
    );
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
