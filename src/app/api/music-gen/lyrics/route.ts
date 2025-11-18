import { getSession } from "auth/server";
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { customModelProvider } from "@/lib/ai/models";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { musicName, genre, mood, style, description } = await request.json();

    if (!musicName || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get a model using the provider's getModel method
    const model = customModelProvider.getModel();
    if (!model) {
      return NextResponse.json(
        { error: "No AI model available" },
        { status: 500 },
      );
    }

    // Create a prompt for generating song lyrics
    const prompt = `You are a professional songwriter. Generate a complete 3-minute song with lyrics based on the following details:

Song Name: ${musicName}
Genre: ${genre}
Mood: ${mood}
Style: ${style}
Description: ${description}

Please generate:
1. A catchy chorus (4-8 lines)
2. Verse 1 (8-12 lines)
3. Verse 2 (8-12 lines)
4. Bridge (4-6 lines)
5. Final chorus (4-8 lines)

Format the output as:
[CHORUS]
(lyrics here)

[VERSE 1]
(lyrics here)

[VERSE 2]
(lyrics here)

[BRIDGE]
(lyrics here)

[CHORUS]
(lyrics here)

Make sure the lyrics are creative, coherent, and match the specified genre, mood, and style. The total song should be approximately 3 minutes long when sung at a normal pace.`;

    console.log("[Lyrics Gen API] Generating lyrics with model");

    const { text: lyrics } = await generateText({
      model,
      prompt,
      temperature: 0.8,
    });

    console.log("[Lyrics Gen API] Generated lyrics successfully");

    return NextResponse.json({
      lyrics,
      musicName,
      genre,
      mood,
      style,
    });
  } catch (error) {
    console.error("[Lyrics Gen API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate lyrics" },
      { status: 500 },
    );
  }
}
