import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Check for error
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      logger.error("OAuth error:", { error, errorDescription });
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=${error}&description=${errorDescription}`,
          request.url,
        ),
      );
    }

    // Supabase OAuth sends token in URL hash (client-side)
    // The token is already in the URL, just redirect to home
    // Supabase client will handle the session from the hash
    logger.info("Auth callback successful, redirecting to home");

    // Redirect to home with the hash intact so Supabase can process it
    return NextResponse.redirect(new URL("/?auth=success", request.url));
  } catch (error) {
    logger.error("Auth callback error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?error=callback_error", request.url),
    );
  }
}
