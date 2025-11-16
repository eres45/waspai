import { getSession } from "auth/server";
import { characterRepository } from "@/lib/db/repository";
import { generateUUID } from "lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      personality,
      icon,
      privacy,
    } = body;

    if (!name || !description || !personality) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const character = await characterRepository.createCharacter({
      id: generateUUID(),
      name,
      description,
      personality,
      icon,
      userId: session.user.id,
      privacy: privacy || "private",
    });

    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    console.error("Error creating character:", error);
    return NextResponse.json(
      { error: "Failed to create character" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "public", "private", or "all"

    console.log(`[Character API] Fetching characters - type: ${type}, userId: ${session.user.id}`);

    let characters;

    if (type === "public") {
      characters = await characterRepository.getPublicCharacters();
    } else if (type === "private") {
      characters = await characterRepository.getPrivateCharactersByUserId(
        session.user.id,
      );
    } else if (type === "all") {
      // Get both user's private characters and all public characters
      const userPrivateCharacters = await characterRepository.getPrivateCharactersByUserId(
        session.user.id,
      );
      const publicCharacters = await characterRepository.getPublicCharacters();
      characters = [...userPrivateCharacters, ...publicCharacters];
      console.log(`[Character API] Found ${userPrivateCharacters.length} private + ${publicCharacters.length} public characters`);
    } else {
      // Default: get user's characters (both private and public)
      characters = await characterRepository.getCharactersByUserId(
        session.user.id,
      );
    }

    console.log(`[Character API] Returning ${characters.length} characters`);
    return NextResponse.json(characters);
  } catch (error) {
    console.error("[Character API] Error fetching characters:", error);
    return NextResponse.json(
      { error: "Failed to fetch characters" },
      { status: 500 },
    );
  }
}
