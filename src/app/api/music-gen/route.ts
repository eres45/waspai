import { getSession } from "auth/server";
import { NextRequest, NextResponse } from "next/server";
import { musicRepository } from "@/lib/db/repository";

// In-memory storage for generated music (temporary)
const musicCache = new Map<string, { buffer: Buffer; lyrics: string; tags: string }>();

const SNAPZION_API_TOKEN = process.env.SNAPZION_API_TOKEN || "NAI-StMBW6GLoPbEYHtnPVz2AOQV5KOijvvUt35ZrXgcoYSUbz1xnHGzvoXG3QEE";
const SNAPZION_UPLOAD_URL = "https://upload.snapzion.com/api/public-upload";

/**
 * Upload audio file to Snapzion
 */
async function uploadToSnapzion(audioBuffer: Buffer, filename: string): Promise<string> {
  try {
    console.log(`[Music Gen API] Uploading to Snapzion: ${filename}`);

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/mpeg" });
    formData.append("file", blob, filename);

    const response = await fetch(SNAPZION_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SNAPZION_API_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error(`[Music Gen API] Snapzion upload failed: ${response.status}`);
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Music Gen API] Upload successful:`, data);

    // Return the file URL
    return data.url || data.file_url || data.secure_url || "";
  } catch (error) {
    console.error("[Music Gen API] Snapzion upload error:", error);
    throw error;
  }
}

/**
 * Music Generation API
 * Generates music with lyrics using sii3.top API
 * 
 * Supports:
 * - lyrics: Song lyrics (can be multi-line)
 * - tags: Music style tags (e.g., sad, piano, hop, pop, epic, orchestra, cinematic)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lyrics, tags = "pop" } = body;

    if (!lyrics || typeof lyrics !== "string") {
      return NextResponse.json(
        { error: "Lyrics are required" },
        { status: 400 }
      );
    }

    console.log(`[Music Gen API] Generating music with lyrics: ${lyrics.substring(0, 50)}...`);
    console.log(`[Music Gen API] Tags: ${tags}`);

    // Call sii3.top music generation API
    // Format: POST with form data
    const formData = new FormData();
    formData.append("lyrics", lyrics);
    formData.append("tags", tags || "pop");

    console.log(`[Music Gen API] Sending request to sii3.top with:`, {
      lyricsLength: lyrics.length,
      tags: tags || "pop",
    });

    const musicResponse = await fetch(
      `https://sii3.top/api/music.php`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!musicResponse.ok) {
      console.error(`[Music Gen API] sii3.top API error: ${musicResponse.status}`);
      throw new Error(`API error: ${musicResponse.status}`);
    }

    // The API returns JSON with a URL to the audio file
    const jsonResponse = await musicResponse.json();
    
    console.log(`[Music Gen API] Got JSON response:`, jsonResponse);

    if (!jsonResponse.url) {
      console.error(`[Music Gen API] No URL in response:`, jsonResponse);
      throw new Error("No audio URL in API response");
    }

    // Download the actual MP3 file from the URL
    console.log(`[Music Gen API] Downloading audio from: ${jsonResponse.url}`);
    const audioResponse = await Promise.race([
      fetch(jsonResponse.url),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Download timeout")), 120000)
      ),
    ]) as Response;

    if (!audioResponse.ok) {
      console.error(`[Music Gen API] Failed to download audio: ${audioResponse.status}`);
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    
    console.log(`[Music Gen API] Audio downloaded successfully (${audioBuffer.byteLength} bytes)`);

    // Check if we got valid audio data
    if (audioBuffer.byteLength < 10000) {
      console.error(`[Music Gen API] Audio buffer too small (${audioBuffer.byteLength} bytes), likely not valid MP3`);
      throw new Error("Invalid audio file size");
    }

    // Upload to Snapzion for permanent storage
    const filename = `music-${Date.now()}.mp3`;
    let permanentUrl = "";
    try {
      permanentUrl = await uploadToSnapzion(Buffer.from(audioBuffer), filename);
      console.log(`[Music Gen API] Permanent URL: ${permanentUrl}`);
    } catch (uploadError) {
      console.warn("[Music Gen API] Snapzion upload failed, using temporary cache:", uploadError);
      // Fall back to temporary cache if upload fails
    }

    // Store in memory cache as backup
    const musicId = Date.now().toString();
    musicCache.set(musicId, {
      buffer: Buffer.from(audioBuffer),
      lyrics,
      tags,
    });

    console.log(`[Music Gen API] Cached music with ID: ${musicId}`);

    // Clean up old entries (keep only last 10)
    if (musicCache.size > 10) {
      const firstKey = musicCache.keys().next().value as string;
      musicCache.delete(firstKey);
    }

    // Save to database
    try {
      const savedMusic = await musicRepository.saveMusicGeneration({
        userId: session.user.id,
        lyrics,
        tags,
        permanentUrl: permanentUrl || undefined,
        tempUrl: `/api/music-gen/stream/${musicId}`,
        fileSize: audioBuffer.byteLength,
      });
      console.log(`[Music Gen API] Saved to database with ID: ${savedMusic.id}`);
    } catch (dbError) {
      console.warn("[Music Gen API] Failed to save to database:", dbError);
      // Don't fail the request if database save fails
    }

    return NextResponse.json({
      id: musicId,
      url: permanentUrl || `/api/music-gen/stream/${musicId}`,
      permanentUrl: permanentUrl || null,
      lyrics,
      tags,
      size: audioBuffer.byteLength,
    });
  } catch (error) {
    console.error("[Music Gen API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate music. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Stream endpoint to serve generated music
 */
export async function GET(request: NextRequest) {
  const { searchParams, pathname } = new URL(request.url);
  
  console.log(`[Music Gen API] GET request - pathname: ${pathname}`);
  console.log(`[Music Gen API] Cache keys:`, Array.from(musicCache.keys()));
  
  // Check if this is a stream request
  if (pathname.includes("/stream/")) {
    const musicId = pathname.split("/stream/")[1];
    
    console.log(`[Music Gen API] Attempting to stream music ID: ${musicId}`);
    console.log(`[Music Gen API] Cache size: ${musicCache.size}`);
    
    const music = musicCache.get(musicId);
    if (!music) {
      console.error(`[Music Gen API] Music not found in cache for ID: ${musicId}`);
      return NextResponse.json(
        { error: "Music not found in cache" },
        { status: 404 }
      );
    }

    console.log(`[Music Gen API] Streaming music: ${musicId} (${music.buffer.length} bytes)`);

    return new NextResponse(music.buffer as any, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": music.buffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Default GET response
  const lyrics = searchParams.get("lyrics");
  const tags = searchParams.get("tags") || "pop";

  if (!lyrics) {
    return NextResponse.json({
      message: "Music Generation API",
      methods: ["POST", "GET"],
      description: "Generate music with lyrics and tags",
      parameters: {
        lyrics: "Song lyrics (required)",
        tags: "Music style tags (optional, default: pop)",
      },
      exampleTags: [
        "epic",
        "orchestra",
        "cinematic",
        "sad",
        "piano",
        "hop",
        "pop",
        "electronic",
        "ambient",
      ],
    });
  }

  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[Music Gen API] GET request - Generating music with lyrics: ${lyrics.substring(0, 50)}...`);

    const params = new URLSearchParams({
      lyrics,
      tags,
    });

    const musicResponse = await fetch(
      `https://sii3.top/api/music.php?${params.toString()}`,
      {
        method: "GET",
      }
    );

    if (!musicResponse.ok) {
      console.error(`[Music Gen API] sii3.top API error: ${musicResponse.status}`);
      throw new Error(`API error: ${musicResponse.status}`);
    }

    const audioBuffer = await musicResponse.arrayBuffer();
    
    // Store in cache
    const musicId = Date.now().toString();
    musicCache.set(musicId, {
      buffer: Buffer.from(audioBuffer),
      lyrics,
      tags,
    });

    console.log(`[Music Gen API] Music generated successfully (${audioBuffer.byteLength} bytes)`);

    return NextResponse.json({
      id: musicId,
      url: `/api/music-gen/stream/${musicId}`,
      lyrics,
      tags,
      size: audioBuffer.byteLength,
    });
  } catch (error) {
    console.error("[Music Gen API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate music. Please try again." },
      { status: 500 }
    );
  }
}
