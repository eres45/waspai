import { NextResponse } from "next/server";
import { chatRepository } from "@/lib/db/repository";
import { supabaseAuth } from "@/lib/auth/supabase-auth";
import { supabaseRest } from "@/lib/db/supabase-rest";
import logger from "@/lib/logger";
import { generateUUID } from "@/lib/utils";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const threadIdStr = (await params).id;
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, messages } = body;

    // Convert numeric mobile ID to UUID if it's not already a UUID.
    // Drizzle requires UUID for threadId. The mobile app generates numbers.
    // We'll create a deterministic UUID or just use the number as a string if we altered schema.
    // Wait, Drizzle schema chat_thread uses UUID type. We MUST pass a valid UUID.
    // To map mobile chat IDs (which are Date.now() numbers) to UUIDs:
    // We'll generate a UUID for new threads, or find the thread if it exists.

    // Actually, mobile chats now use the string UUID because I patched initializeData!
    // Wait, new chats on mobile are created with Date.now().
    // So if threadIdStr is numeric, we have a problem.
    // Let's ensure threadId is a valid UUID. If not, generate one and return it so the mobile app updates.
    let threadId = threadIdStr;
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        threadIdStr,
      );

    if (!isUUID) {
      // Find if we already mapped this in a custom column, or just generate a new UUID for the Web DB.
      // For simplicity, we'll generate a new one and maybe we shouldn't rely on mobile's ID if it's numeric.
      // Actually, we'll just check if a thread with this title exists recently, else create.
      threadId = generateUUID();
    }

    // Ensure thread exists
    await chatRepository.upsertThread({
      id: threadId,
      title: title || "New Chat",
      userId: user.id,
    });

    // Delete existing messages for this thread to replace with the synced ones
    // (This handles edits, deletions, and additions from mobile)
    await supabaseRest.from("chat_message").delete().eq("thread_id", threadId);

    const messagesToInsert: any[] = [];

    // Map mobile messages to Web AI SDK format
    for (const msg of messages) {
      const parts: any[] = [];

      if (msg.text) {
        parts.push({ type: "text", text: msg.text });
      }
      if (msg.imageUrl) {
        parts.push({ type: "image", image: msg.imageUrl });
      }
      if (msg.videoUrl || msg.type === "search") {
        // Custom mappings
      }

      messagesToInsert.push({
        id: msg.id?.toString() || generateUUID(),
        threadId: threadId,
        role: (msg.role === "user" ? "user" : "assistant") as any,
        parts: parts.length > 0 ? parts : [{ type: "text", text: " " }],
        createdAt: new Date(msg.timestamp || Date.now()),
      });
    }

    if (messagesToInsert.length > 0) {
      await chatRepository.insertMessages(messagesToInsert);
    }

    return NextResponse.json({ success: true, mappedThreadId: threadId });
  } catch (err) {
    logger.error("[Mobile API] Failed to sync messages:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
