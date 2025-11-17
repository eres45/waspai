import { signInWithEmail } from "@/lib/auth/supabase-auth";
import logger from "@/lib/logger";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    logger.info(`Sign-in attempt for: ${email}`);

    const result = await signInWithEmail(email, password);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-user", JSON.stringify(result.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    logger.info(`User signed in successfully: ${result.user.id}`);

    return Response.json(
      {
        success: true,
        user: result.user,
        message: "Successfully signed in",
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Sign-in error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to sign in",
      },
      { status: 401 },
    );
  }
}
