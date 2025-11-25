import { supabaseAuth } from "@/lib/auth/supabase-auth";
import logger from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    logger.info(`Checking email verification status for: ${email}`);

    // Get user by email
    const { data: userData, error: getUserError } =
      await supabaseAuth.auth.admin.listUsers();

    if (getUserError) {
      logger.error("Error listing users:", getUserError);
      return Response.json(
        { error: "Failed to check email verification" },
        { status: 500 },
      );
    }

    const user = userData.users.find((u) => u.email === email);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email is verified
    const isVerified = !!user.email_confirmed_at;

    logger.info(`Email verification status for ${email}: ${isVerified}`);

    return Response.json(
      {
        success: true,
        email,
        verified: isVerified,
        email_confirmed_at: user.email_confirmed_at,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Email verification check error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check email verification",
      },
      { status: 500 },
    );
  }
}
