"use server";

import { BasicUser, UserZodSchema } from "app-types/user";
import { ActionState } from "lib/action-utils";
import { signUpWithEmail, emailExists } from "@/lib/auth/supabase-auth";
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

    // Set a session cookie with user info so they're authenticated
    const cookieStore = await cookies();
    cookieStore.set("auth-user", JSON.stringify(result.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return {
      user: result.user as BasicUser,
      success: true,
      message: "Successfully signed up",
    };
  } catch (error) {
    logger.error("Sign up error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to sign up",
    };
  }
}
