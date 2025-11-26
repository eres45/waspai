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

    logger.info(
      `TTS API called: voice=${voice}, text="${text?.substring(0, 50)}..."`,
    );

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
        },
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
        },
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

    let response;
    let retries = 3;
    let lastError: Error | null = null;

    // Retry logic for TTS API
    while (retries > 0) {
      try {
        logger.info(
          `TTS API attempt ${4 - retries}/3: Calling https://vetrex.x10.mx/api/tts.php`,
        );

        response = await fetch("https://vetrex.x10.mx/api/tts.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: ttsBody,
        });

        logger.info(`TTS API response status: ${response.status}`);

        if (response.ok) {
          logger.info(`TTS API attempt ${4 - retries}/3: SUCCESS`);
          break; // Success, exit retry loop
        }

        const errorText = await response.text();
        lastError = new Error(
          `TTS API error: ${response.status} - ${errorText}`,
        );
        logger.warn(
          `TTS API attempt failed (${4 - retries}/3): ${response.status} - ${errorText}`,
        );
        retries--;

        if (retries > 0) {
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (4 - retries)),
          );
        }
      } catch (fetchError) {
        lastError = fetchError as Error;
        logger.warn(
          `TTS API fetch error (${4 - retries}/3): ${lastError.message}`,
        );
        retries--;

        if (retries > 0) {
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (4 - retries)),
          );
        }
      }
    }

    if (!response || !response.ok) {
      const errorMessage = lastError?.message || "TTS API failed after retries";
      logger.error(`TTS API error: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const data: TTSResponse = await response.json();

    if (!data.success || !data.audio_url) {
      logger.error(`TTS API failed: ${JSON.stringify(data)}`);
      throw new Error(data.error || "Failed to generate speech");
    }

    logger.info(`TTS API success: audio_url=${data.audio_url}`);

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
      },
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
      },
    );
  }
}
