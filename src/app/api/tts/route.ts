import { NextRequest } from "next/server";
import logger from "logger";

interface TTSResponse {
  success: boolean;
  audio_url?: string;
  error?: string;
}

/**
 * TTS API Proxy
 * Proxies requests to the custom TTS API to avoid CORS issues
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = "nova", language } = body;

    logger.info(`TTS API called: voice=${voice}, text="${text?.substring(0, 50)}..."`);

    if (!text || typeof text !== "string") {
      logger.error(`Invalid text: ${JSON.stringify(text)}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Text is required and must be a string",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!voice || typeof voice !== "string") {
      logger.error(`Invalid voice: ${JSON.stringify(voice)}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Voice is required and must be a string",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Call the external TTS API
    const ttsPayload: any = {
      text: text.trim(),
      voice: voice.trim(),
    };
    
    if (language) {
      ttsPayload.language = language;
    }
    
    const ttsBody = JSON.stringify(ttsPayload);

    logger.info(`Calling external TTS API with: ${ttsBody}`);

    const response = await fetch("https://vetrex.x10.mx/api/tts.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: ttsBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`TTS API error: ${response.status} - ${errorText}`);
      throw new Error(`TTS API error: ${response.status}`);
    }

    const data: TTSResponse = await response.json();

    if (!data.success || !data.audio_url) {
      logger.error(`TTS API failed: ${JSON.stringify(data)}`);
      throw new Error(data.error || "Failed to generate speech");
    }

    logger.info(`TTS API success: ${data.audio_url}`);

    return new Response(
      JSON.stringify({
        success: true,
        audio_url: data.audio_url,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    logger.error(`TTS API error: ${error}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
