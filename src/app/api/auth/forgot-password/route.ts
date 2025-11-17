import { supabaseAuth } from "@/lib/auth/supabase-auth";
import logger from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    logger.info(`Password reset requested for: ${email}`);

    // Send password reset email
    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`,
    });

    if (error) {
      logger.error(`Password reset error for ${email}:`, error);
      return Response.json({ error: error.message }, { status: 400 });
    }

    logger.info(`Password reset email sent to: ${email}`);

    return Response.json(
      {
        success: true,
        message: "Password reset email sent. Check your inbox.",
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Password reset error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send reset email",
      },
      { status: 500 },
    );
  }
}
