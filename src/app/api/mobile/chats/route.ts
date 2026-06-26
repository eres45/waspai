import { NextResponse } from "next/server";
import { chatRepository } from "@/lib/db/repository";
import { supabaseAuth } from "@/lib/auth/supabase-auth";
import logger from "@/lib/logger";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify Supabase token
    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      logger.error("[Mobile API] Unauthorized access attempt:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's chat threads
    const threads = await chatRepository.selectThreadsByUserId(user.id);

    // Convert to mobile app format for easy parsing on frontend
    const mobileChats = threads.map((thread) => ({
      id: thread.id, // Mobile needs this mapped, Web uses string UUIDs, Mobile used BigInts. Since mobile is a client, we'll return the string UUID
      user_id: thread.userId,
      title: thread.title,
      preview: "Chat loaded from Web",
      timestamp: new Date(thread.createdAt).getTime(),
      created_at: thread.createdAt,
    }));

    return NextResponse.json(mobileChats);
  } catch (err) {
    logger.error("[Mobile API] Failed to fetch chats:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
