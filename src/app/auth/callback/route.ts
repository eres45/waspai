import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { supabaseAuth } from "@/lib/auth/supabase-auth";
import { cookies } from "next/headers";
import { userRepositoryRest } from "@/lib/db/pg/repositories/user-repository.rest";

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

        if (data?.session && data?.user) {
          const user = data.user;
          const email = user.email || "";
          const name =
            user.user_metadata?.name ||
            user.user_metadata?.preferred_username ||
            email.split("@")[0] ||
            "GitHub User";
          const avatarUrl = user.user_metadata?.avatar_url || null;

          // Create or update user in database with avatar
          try {
            logger.info(
              `[AuthCallback] Attempting to sync user ${user.id} (${email}) with name "${name}" and avatar "${avatarUrl}"`,
            );
            await userRepositoryRest.createOrUpdateUser(
              user.id,
              email,
              name,
              avatarUrl,
            );
            logger.info(
              `[AuthCallback] GitHub user created/updated: ${email} with avatar: ${avatarUrl}`,
            );
          } catch (dbErr) {
            logger.error(
              `[AuthCallback] Failed to create/update user in database: ${email}`,
              dbErr,
            );
            // Continue anyway - user is authenticated in Supabase
          }

          // Set session cookies with enriched user data
          const cookieStore = await cookies();

          // Clear any old auth cookies first
          cookieStore.delete("auth-user");
          cookieStore.delete("better-auth.session_token");

          // Ensure user object has name and image from GitHub
          const enrichedUser = {
            ...data.user,
            name: name,
            image: avatarUrl,
          };

          cookieStore.set("auth-user", JSON.stringify(enrichedUser), {
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

          logger.info(
            `User authenticated via GitHub: ${email} with name: ${name}`,
          );
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
