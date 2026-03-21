import { NextRequest } from "next/server";

/**
 * Audio Proxy Endpoint
 * Downloads audio from external URLs and serves them to avoid CORS issues
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audioUrl = searchParams.get("url");

    if (!audioUrl) {
      return new Response(
        JSON.stringify({
          error: "Audio URL is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(audioUrl);

    // Validate URL protocol to prevent Next.js fetch crash
    if (
      !decodedUrl.startsWith("http://") &&
      !decodedUrl.startsWith("https://")
    ) {
      return new Response(
        JSON.stringify({
          error: "Invalid URL protocol. Must be http or https",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(`[Audio Proxy] Fetching audio from: ${decodedUrl}`);

    // Fetch the audio from the external source
    const response = await fetch(decodedUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "*/*",
      },
      // cache: "no-store" to prevent Next.js from caching the proxy response or breaking streams
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `[Audio Proxy] Failed to fetch audio: ${response.status} ${response.statusText}`,
      );
      throw new Error(`Failed to fetch audio: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "audio/mpeg";
    const buffer = await response.arrayBuffer();

    console.log(
      `[Audio Proxy] Successfully fetched audio: ${buffer.byteLength} bytes`,
    );

    // Return the audio with proper headers
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error(`[Audio Proxy] Error:`, error);
    return new Response(
      JSON.stringify({
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
