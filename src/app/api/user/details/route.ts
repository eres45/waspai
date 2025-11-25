import { getSession } from "auth/server";
import { userRepositoryRest } from "lib/db/pg/repositories/user-repository.rest";
import { NextResponse } from "next/server";
import logger from "logger";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      logger.warn("No session found for user details request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      // Use Supabase REST API instead of direct PostgreSQL (works on Vercel)
      const user = await userRepositoryRest.getUserById(session.user.id);

      if (!user) {
        logger.warn(`User not found in database: ${session.user.id}`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json(user);
    } catch (dbError: any) {
      // If database fails, return user info from session as fallback
      logger.warn(
        "Database query failed, using session data as fallback:",
        dbError.message,
      );

      return NextResponse.json({
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.name || "User",
        image: session.user.image || null,
        githubUsername: session.user.user_metadata?.preferred_username || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      });
    }
  } catch (error: any) {
    logger.error("Error fetching user details:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to get user details",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
