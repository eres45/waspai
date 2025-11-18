import { getSession } from "auth/server";
import { NextRequest, NextResponse } from "next/server";
import { musicRepository } from "@/lib/db/repository";

/**
 * Get music generation history for the current user
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      `[Music History API] Fetching history for user: ${session.user.id}`,
    );

    const history = await musicRepository.getRecentMusicGenerations(
      session.user.id,
      50, // Get last 50 songs
    );

    console.log(
      `[Music History API] Found ${history.length} music generations`,
    );

    return NextResponse.json(history);
  } catch (error) {
    console.error("[Music History API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch music history" },
      { status: 500 },
    );
  }
}
