import { getSession } from "auth/server";
import { characterRepository } from "@/lib/db/repository";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const character = await characterRepository.getCharacterById(resolvedParams.id);

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
    }

    // Check if user has access (owner or public character)
    if (
      character.userId !== session.user.id &&
      character.privacy === "private"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(character);
  } catch (error) {
    console.error("Error fetching character:", error);
    return NextResponse.json(
      { error: "Failed to fetch character" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { name, description, personality, icon, privacy } = body;

    const character = await characterRepository.updateCharacter(
      resolvedParams.id,
      session.user.id,
      {
        name,
        description,
        personality,
        icon,
        privacy,
      },
    );

    if (!character) {
      return NextResponse.json(
        { error: "Character not found or unauthorized" },
        { status: 404 },
      );
    }

    return NextResponse.json(character);
  } catch (error) {
    console.error("Error updating character:", error);
    return NextResponse.json(
      { error: "Failed to update character" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const deleted = await characterRepository.deleteCharacter(
      resolvedParams.id,
      session.user.id,
    );

    if (!deleted) {
      return NextResponse.json(
        { error: "Character not found or unauthorized" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting character:", error);
    return NextResponse.json(
      { error: "Failed to delete character" },
      { status: 500 },
    );
  }
}
