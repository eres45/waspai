import { getSession } from "auth/server";
import { chatRepository } from "lib/db/repository";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// CORS preflight OPTIONS handler
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// GET all threads for user
export async function GET() {
  const session = await getSession();

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const threads = await chatRepository.selectThreadsByUserId(session.user.id);
    return NextResponse.json(threads, { headers: corsHeaders });
  } catch (error) {
    console.error("[API thread GET] Error listing threads:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}

// POST to create a new thread
export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const threadId = body.id || crypto.randomUUID();
    const title = body.title || "";

    const newThread = await chatRepository.insertThread({
      id: threadId,
      title: title,
      userId: session.user.id,
    });

    return NextResponse.json(newThread, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("[API thread POST] Error creating thread:", error);
    return new Response(JSON.stringify({ error: "Failed to create thread" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}

// DELETE all threads for user
export async function DELETE() {
  const session = await getSession();

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    await chatRepository.deleteAllThreads(session.user.id);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("[API thread DELETE] Error deleting threads:", error);
    return new Response(JSON.stringify({ error: "Failed to delete threads" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}
