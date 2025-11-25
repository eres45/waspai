"use server";

import { BasicUser, UserZodSchema } from "app-types/user";
import { ActionState } from "lib/action-utils";
import {
  signUpWithEmail,
  emailExists,
  supabaseAuth,
} from "@/lib/auth/supabase-auth";
import { userRepositoryRest } from "@/lib/db/pg/repositories/user-repository.rest";
import logger from "@/lib/logger";
import { cookies } from "next/headers";

export async function existsByEmailAction(email: string) {
  try {
    const exists = await emailExists(email);
    return exists;
  } catch (error) {
    logger.error("Error checking if email exists:", error);
    return false;
  }
}

type SignUpActionResponse = ActionState & {
  user?: BasicUser;
};

export async function signUpAction(data: {
  email: string;
  name: string;
  password: string;
}): Promise<SignUpActionResponse> {
  const { success, data: parsedData } = UserZodSchema.safeParse(data);
  if (!success) {
    return {
      success: false,
      message: "Invalid data",
    };
  }
  try {
    const result = await signUpWithEmail(
      parsedData.email,
      parsedData.password,
      parsedData.name,
    );

    // Create user in database for foreign key constraints
    try {
      await userRepositoryRest.createOrUpdateUser(
        result.user.id,
        result.user.email || parsedData.email,
        result.user.name || "",
      );
    } catch (dbError) {
      logger.error("Error creating user in database:", dbError);
      // Don't fail the sign-up if database creation fails, but log it
    }

    // Set session cookies with user info so they're authenticated
    const cookieStore = await cookies();
    cookieStore.set("auth-user", JSON.stringify(result.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Also set the Better-Auth session cookie for middleware compatibility
    cookieStore.set(
      "better-auth.session_token",
      JSON.stringify({
        user: result.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    );

    return {
      user: result.user as unknown as BasicUser,
      success: true,
      message: result.requiresEmailVerification
        ? "Successfully signed up! Please check your email to verify your account."
        : "Successfully signed up",
    };
  } catch (error) {
    logger.error("Sign up error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to sign up",
    };
  }
}

export async function signInWithGitHubAction() {
  try {
    const { data, error } = await supabaseAuth.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

    if (error) {
      logger.error("GitHub OAuth error:", error);
      return {
        success: false,
        error: error.message || "Failed to sign in with GitHub",
      };
    }

    // Return the OAuth URL for client to redirect to
    if (data?.url) {
      return {
        success: true,
        url: data.url,
      };
    }

    return {
      success: false,
      error: "No OAuth URL returned from Supabase",
    };
  } catch (error) {
    logger.error("GitHub OAuth error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to sign in with GitHub",
    };
  }
}
