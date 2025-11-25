import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    logger.info("Auth callback received", {
      code: !!code,
      error,
      errorDescription,
    });

    if (error) {
      logger.error("OAuth error:", { error, errorDescription });
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=${error}&description=${errorDescription}`,
          request.url,
        ),
      );
    }

    if (!code) {
      logger.error("No code provided in callback");
      return NextResponse.redirect(
        new URL("/auth/error?error=no_code", request.url),
      );
    }

    // Supabase handles the code exchange automatically
    // Just redirect to home page
    logger.info("Auth callback successful, redirecting to home");
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    logger.error("Auth callback error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?error=callback_error", request.url),
    );
  }
}
