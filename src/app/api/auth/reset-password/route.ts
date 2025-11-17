import { supabaseAuth } from "@/lib/auth/supabase-auth";
import logger from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return Response.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    logger.info("Password reset attempt");

    // Verify the token and get the user
    const { data: userData, error: verifyError } =
      await supabaseAuth.auth.verifyOtp({
        token_hash: token,
        type: "recovery",
      });

    if (verifyError || !userData.user) {
      logger.error("Token verification error:", verifyError);
      return Response.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    // Update the user's password using admin API
    const { data, error } = await supabaseAuth.auth.admin.updateUserById(
      userData.user.id,
      { password },
    );

    if (error) {
      logger.error("Password reset error:", error);
      return Response.json({ error: error.message }, { status: 400 });
    }

    logger.info(`Password reset successful for user: ${data.user?.id}`);

    return Response.json(
      {
        success: true,
        message: "Password reset successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Password reset error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to reset password",
      },
      { status: 500 },
    );
  }
}
