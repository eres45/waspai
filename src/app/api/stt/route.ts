import { NextRequest } from "next/server";
import logger from "logger";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SARVAM_API_KEY) {
      logger.error("SARVAM_API_KEY is not configured in the environment.");
      return Response.json(
        { success: false, error: "Sarvam Speech-to-Text key not configured" },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const model = (formData.get("model") as string) || "saaras:v3";
    const languageCode = (formData.get("language_code") as string) || "hi-IN";

    if (!file) {
      return Response.json(
        { success: false, error: "No audio file provided in request form" },
        { status: 400 },
      );
    }

    // Call Sarvam AI STT API using multipart/form-data
    const sarvamFormData = new FormData();
    sarvamFormData.append("file", file);
    sarvamFormData.append("model", model);
    sarvamFormData.append("language_code", languageCode);

    logger.info(
      `Sarvam STT: file=${file.name}, size=${file.size} bytes, model=${model}, lang=${languageCode}`,
    );

    const sarvamResponse = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": process.env.SARVAM_API_KEY,
      },
      body: sarvamFormData,
    });

    if (!sarvamResponse.ok) {
      const err = await sarvamResponse.text();
      logger.error(`Sarvam STT error ${sarvamResponse.status}: ${err}`);
      return Response.json(
        {
          success: false,
          error: `Sarvam STT provider error: ${sarvamResponse.status}`,
        },
        { status: 502 },
      );
    }

    const resData = await sarvamResponse.json();
    logger.info(`Sarvam STT success: transcript generated successfully`);

    return Response.json({ success: true, ...resData }, { status: 200 });
  } catch (error) {
    logger.error(`STT proxy error: ${error}`);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({
    success: true,
    enabled: !!process.env.SARVAM_API_KEY,
  });
}
