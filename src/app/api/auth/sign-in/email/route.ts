import { signInWithEmail } from "@/lib/auth/supabase-auth";
import logger from "@/lib/logger";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("[DEBUG API] Sign-in request received for:", email);

    if (!email || !password) {
      console.log("[DEBUG API] Missing email or password");
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    logger.info(`Sign-in attempt for: ${email}`);
    console.log("[DEBUG API] Calling signInWithEmail");

    // Sign in with Supabase Auth
    let user;
    let session;
    try {
      const result = await signInWithEmail(email, password);
      user = result.user;
      session = result.session;
      console.log("[DEBUG API] signInWithEmail response - user:", user);
    } catch (signInError) {
      console.log("[DEBUG API] Sign-in failed - error:", signInError);
      logger.error(`Sign-in failed for ${email}:`, signInError);
      return Response.json(
        {
          error:
            signInError instanceof Error
              ? signInError.message
              : "Invalid email or password",
        },
        { status: 401 },
      );
    }

    if (!user || !session) {
      console.log("[DEBUG API] Sign-in failed - missing user or session");
      logger.error(`Sign-in failed for ${email}: missing user or session`);
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    logger.info(`User signed in successfully: ${user.id}`);
    console.log("[DEBUG API] User signed in successfully:", user.id);

    // Set session cookie
    const cookieStore = await cookies();

    console.log("[DEBUG API] Setting auth-user cookie");
    cookieStore.set("auth-user", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    logger.info(`Session cookie set for user: ${user.id}`);
    console.log("[DEBUG API] Session cookie set successfully");

    return Response.json(
      {
        success: true,
        message: "Successfully signed in",
        user,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[DEBUG API] Sign-in exception:", error);
    logger.error("Sign-in error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to sign in",
      },
      { status: 500 },
    );
  }
}
