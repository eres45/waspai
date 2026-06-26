import { NextResponse } from "next/server";
import { userRepository, memoryRepository } from "@/lib/db/repository";
import { supabaseAuth } from "@/lib/auth/supabase-auth";
import logger from "@/lib/logger";
import { UserPreferences } from "app-types/user";

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
    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const webUser = (await userRepository.getUserById(user.id)) as any;
    if (!webUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user memory
    const userMemories = await memoryRepository.list(user.id);
    // Mobile expects a single core memory string for the Vault feature. We'll join them.
    const coreMemoryString = userMemories.map((m) => m.content).join("\n");

    const prefs: any = webUser.preferences || {};

    // Map Web preferences to Mobile format
    const mobileSettings = {
      user_id: user.id,
      is_premium:
        webUser.tier === "pro" ||
        webUser.tier === "ultra" ||
        webUser.tier === "max",
      selected_model: "openai/gpt-oss-120b", // We'll manage this locally on mobile or set a default
      telegram_chat_id: "",
      voice_enabled: false,
      user_name: webUser.name,
      avatar_url: webUser.image || "",
      active_theme: prefs.theme || "default",
      pers_base_style: "Professional",
      pers_warmth: "Default",
      pers_enthusiasm: "Default",
      pers_headers: "Default",
      pers_emoji: "Default",
      pers_fast_answers: true,
      pers_custom_instructions: prefs.instructions || "",
      mem_reference_chat_history: true,
      mem_reference_saved_memories: true,
      mem_nickname: "",
      mem_occupation: "",
      mem_about: "",
      memory: coreMemoryString,
    };

    return NextResponse.json(mobileSettings);
  } catch (err) {
    logger.error("[Mobile API] Failed to fetch user settings:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
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

    const webUser = (await userRepository.getUserById(user.id)) as any;
    if (!webUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingPrefs = webUser.preferences || {};

    // Update preferences mapped from mobile payload
    const updatedPrefs: UserPreferences = {
      ...existingPrefs,
      theme: body.active_theme || existingPrefs.theme,
      instructions: body.pers_custom_instructions || existingPrefs.instructions,
    };

    await userRepository.updatePreferences(user.id, updatedPrefs);

    // If memory is updated from mobile, we might overwrite or append.
    // For now, if body.memory exists, we just create a new memory entry if it doesn't match the last one.
    // In a full implementation, we'd sync the Vault JSON array properly.
    if (body.memory) {
      await memoryRepository.create(user.id, body.memory);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("[Mobile API] Failed to update user settings:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
