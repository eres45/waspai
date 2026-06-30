import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { supabaseAuth } from "@/lib/auth/supabase-auth";
import { cookies } from "next/headers";
import { userRepositoryRest } from "@/lib/db/pg/repositories/user-repository.rest";
import { sendWelcomeEmail } from "@/lib/email";

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
          let dbUserRole: string | null = null;
          try {
            logger.info(
              `[AuthCallback] Attempting to sync user ${user.id} (${email}) with name "${name}" and avatar "${avatarUrl}"`,
            );
            const dbUser = await userRepositoryRest.createOrUpdateUser(
              user.id,
              email,
              name,
              avatarUrl,
            );
            // Capture role from DB so it can be included in the session cookie
            dbUserRole = (dbUser as any)?.role ?? null;
            logger.info(
              `[AuthCallback] User created/updated: ${email} with role: ${dbUserRole}`,
            );

            // Hook Into Welcome Email: Check if welcomeEmailSent is false
            if (dbUser && !dbUser.welcomeEmailSent) {
              logger.info(
                `[AuthCallback] Welcome email not sent yet for user: ${email}. Sending now...`,
              );
              const sendResult = await sendWelcomeEmail(email, name);
              if (sendResult.success) {
                await userRepositoryRest.setWelcomeEmailSent(user.id, true);
                logger.info(
                  `[AuthCallback] Welcome email sent and recorded in DB for user: ${email}`,
                );
              }
            }
          } catch (dbErr) {
            logger.error(
              `[AuthCallback] Failed to create/update user or send welcome email: ${email}`,
              dbErr,
            );
            // Continue anyway - user is authenticated in Supabase
          }

          // Set session cookies with enriched user data
          const cookieStore = await cookies();

          // Clear any old auth cookies first
          cookieStore.delete("auth-user");
          cookieStore.delete("better-auth.session_token");

          // Ensure user object has name, image, and role from DB
          const enrichedUser = {
            ...data.user,
            name: name,
            image: avatarUrl,
            // Include role from database so admin checks work correctly
            role: dbUserRole ?? data.user.role ?? "user",
          };

          cookieStore.set("auth-user", JSON.stringify(enrichedUser), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
          });

          cookieStore.set(
            "better-auth.session_token",
            data.session.access_token,
            {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30, // 30 days
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

    // Redirect to chat
    logger.info("Auth callback successful, redirecting to chat");
    return NextResponse.redirect(new URL("/chat", request.url));
  } catch (error) {
    logger.error("Auth callback error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?error=callback_error", request.url),
    );
  }
}
