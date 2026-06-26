import { NextResponse } from "next/server";
import { chatRepository } from "@/lib/db/repository";
import { supabaseAuth } from "@/lib/auth/supabase-auth";
import logger from "@/lib/logger";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const threadId = (await params).id;
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

    // Security check: ensure the thread belongs to the user
    const threads = await chatRepository.selectThreadsByUserId(user.id);
    const hasAccess = threads.some((t) => t.id === threadId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Not Found or Unauthorized" },
        { status: 404 },
      );
    }

    const dbMessages = await chatRepository.selectMessagesByThreadId(threadId);

    // Map AI SDK `parts` format back into the flat format expected by the Mobile App
    // The mobile app expects: { id, role, text, type, is_user, prompt, image_url, video_url, attachments }
    const mobileMessages = dbMessages.map((msg) => {
      let text = "";
      let type = "text";
      let prompt = null;
      let imageUrl = null;
      const videoUrl = null;
      const attachments: any[] = [];

      // Extract content from parts array
      const parts = msg.parts as any;
      if (Array.isArray(parts)) {
        parts.forEach((part) => {
          if (part.type === "text") {
            text += part.text;
          } else if (part.type === "image") {
            // Note: UI message image part contains base64 or URL
            const url =
              part.image instanceof URL
                ? part.image.toString()
                : typeof part.image === "string"
                  ? part.image
                  : "";
            if (!imageUrl) {
              imageUrl = url;
              type = "image";
            } else {
              // Additional images go to attachments if needed, but mobile mainly supports one hero image per message
              attachments.push({ type: "image", url });
            }
          } else if (part.type === "file") {
            attachments.push({
              type: "file",
              url:
                part.data instanceof URL
                  ? part.data.toString()
                  : typeof part.data === "string"
                    ? part.data
                    : "",
              mimeType: part.mimeType,
            });
          } else if (part.type === "tool-invocation") {
            // If there's a tool invocation, format it in the text stream or ignore based on mobile support
            // The mobile app supports XML tags natively so we can inject them back
            if (part.toolInvocation.toolName === "web-search") {
              type = "search";
              prompt = part.toolInvocation.args?.query || "";
            }
          }
        });
      }

      return {
        id: msg.id,
        chat_id: threadId,
        user_id: user.id,
        role: msg.role,
        text: text,
        type: type,
        is_user: msg.role === "user",
        prompt: prompt,
        image_url: imageUrl,
        video_url: videoUrl,
        attachments: attachments,
        created_at: msg.createdAt,
      };
    });

    return NextResponse.json(mobileMessages);
  } catch (err) {
    logger.error("[Mobile API] Failed to fetch messages:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
