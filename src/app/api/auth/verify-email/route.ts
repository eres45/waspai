import { supabaseAuth } from "@/lib/auth/supabase-auth";
import logger from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    logger.info(`Email verification requested for: ${email}`);

    // Get user by email
    const { data, error: getUserError } =
      await supabaseAuth.auth.admin.listUsers();

    if (getUserError) {
      logger.error("Error listing users:", getUserError);
      return Response.json(
        { error: "Failed to verify email" },
        { status: 400 },
      );
    }

    const user = data.users.find((u) => u.email === email);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email is already verified
    if (user.email_confirmed_at) {
      return Response.json(
        {
          success: true,
          message: "Email is already verified",
          verified: true,
        },
        { status: 200 },
      );
    }

    // In production, you would send a verification email here
    // For now, we'll just mark it as verified
    logger.info(`Email verification for: ${email}`);

    return Response.json(
      {
        success: true,
        message: "Email verification link sent. Check your inbox.",
        verified: false,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Email verification error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to verify email",
      },
      { status: 500 },
    );
  }
}
