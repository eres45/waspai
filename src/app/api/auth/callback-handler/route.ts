import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { supabaseAuth } from "@/lib/auth/supabase-auth";
import { userRepositoryRest } from "@/lib/db/pg/repositories/user-repository.rest";
import { cookies } from "next/headers";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token provided" },
        { status: 400 },
      );
    }

    logger.info("Processing OAuth callback with access token");

    // Set the session in Supabase
    const { data, error } = await supabaseAuth.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || "",
    });

    if (error) {
      logger.error("Failed to set session:", error);
      return NextResponse.json(
        { error: error.message || "Failed to set session" },
        { status: 400 },
      );
    }

    if (!data?.user) {
      logger.error("No user data returned from session");
      return NextResponse.json(
        { error: "No user data returned" },
        { status: 400 },
      );
    }

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
      const dbUser = await userRepositoryRest.createOrUpdateUser(
        user.id,
        email,
        name,
        avatarUrl,
      );
      logger.info(
        `GitHub user created/updated: ${email} with avatar: ${avatarUrl}`,
      );

      // Check if welcome email has not been sent yet
      if (dbUser && !dbUser.welcomeEmailSent) {
        logger.info(
          `Welcome email not sent yet for user: ${email}. Sending now...`,
        );
        const sendResult = await sendWelcomeEmail(email, name);
        if (sendResult.success) {
          await userRepositoryRest.setWelcomeEmailSent(user.id, true);
          logger.info(
            `Welcome email sent and recorded in DB for user: ${email}`,
          );
        }
      }
    } catch (dbErr) {
      logger.error(
        `Failed to create/update user or send welcome email: ${email}`,
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

    if (data.session) {
      cookieStore.set("better-auth.session_token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    logger.info(`User authenticated via GitHub: ${email} with name: ${name}`);

    return NextResponse.json({
      success: true,
      email,
      name,
      image: avatarUrl,
    });
  } catch (error) {
    logger.error("Callback handler error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Callback handler error",
      },
      { status: 500 },
    );
  }
}
