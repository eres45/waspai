import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { supabaseAuth } from "@/lib/auth/supabase-auth";
import { cookies } from "next/headers";

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

    // Get the code from GitHub OAuth
    const code = searchParams.get("code");

    if (code) {
      try {
        // Exchange code for session
        const { data, error: exchangeError } =
          await supabaseAuth.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          logger.error("Code exchange error:", exchangeError);
          return NextResponse.redirect(
            new URL(
              `/auth/error?error=exchange_failed&description=${exchangeError.message}`,
              request.url,
            ),
          );
        }

        if (data?.session) {
          // Set session cookies
          const cookieStore = await cookies();
          cookieStore.set("auth-user", JSON.stringify(data.user), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });

          cookieStore.set(
            "better-auth.session_token",
            data.session.access_token,
            {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7, // 7 days
            },
          );

          logger.info(`User authenticated via GitHub: ${data.user.email}`);
        }
      } catch (exchangeErr) {
        logger.error("Session exchange error:", exchangeErr);
      }
    }

    // Redirect to home
    logger.info("Auth callback successful, redirecting to home");
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    logger.error("Auth callback error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?error=callback_error", request.url),
    );
  }
}
