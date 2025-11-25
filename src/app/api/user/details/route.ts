import { getSession } from "auth/server";
import { NextResponse } from "next/server";
import logger from "logger";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      logger.warn("No session found for user details request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return user data from session immediately (fast path)
    // Session already has the latest user data from GitHub OAuth
    const now = new Date().toISOString();

    const userData = {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.name || session.user.email?.split("@")[0] || "User",
      image: session.user.image || null,
      createdAt: session.user.createdAt || now,
      updatedAt: session.user.updatedAt || now,
      lastLogin: session.user.lastLogin || now,
      emailVerified: session.user.emailVerified || false,
      role: session.user.role || "user",
    };

    return NextResponse.json(userData);
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
