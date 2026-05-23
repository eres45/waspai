import { getSession } from "auth/server";
import { chatRepository } from "lib/db/repository";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// GET single thread details (including messages)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;

  try {
    const hasAccess = await chatRepository.checkAccess(id, session.user.id);
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const threadDetails = await chatRepository.selectThreadDetails(id);
    if (!threadDetails) {
      return new Response(JSON.stringify({ error: "Thread not found" }), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    return NextResponse.json(threadDetails, { headers: corsHeaders });
  } catch (error) {
    console.error(`[API thread GET ${id}] Error:`, error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}

// POST or PUT to update thread title
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleUpdate(request, params);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleUpdate(request, params);
}

async function handleUpdate(
  request: Request,
  paramsPromise: Promise<{ id: string }>,
) {
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

  const { id } = await paramsPromise;

  try {
    const hasAccess = await chatRepository.checkAccess(id, session.user.id);
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const body = await request.json().catch(() => ({}));
    if (!body.title) {
      return new Response(JSON.stringify({ error: "Missing 'title' field" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const updatedThread = await chatRepository.updateThread(id, {
      title: body.title,
    });

    return NextResponse.json(updatedThread, { headers: corsHeaders });
  } catch (error) {
    console.error(`[API thread update ${id}] Error:`, error);
    return new Response(JSON.stringify({ error: "Failed to update thread" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}

// DELETE a specific thread
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;

  try {
    const hasAccess = await chatRepository.checkAccess(id, session.user.id);
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    await chatRepository.deleteThread(id);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error(`[API thread DELETE ${id}] Error:`, error);
    return new Response(JSON.stringify({ error: "Failed to delete thread" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}
