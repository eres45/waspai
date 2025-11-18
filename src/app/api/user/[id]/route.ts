import { getSession } from "auth/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;

    // Users can only view their own data, unless they're an admin
    if (session.user.id !== userId) {
      // TODO: Add admin check here if needed
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Return user data from session
    return NextResponse.json({
      id: session.user.id,
      name: session.user.name || "",
      email: session.user.email || "",
      image: session.user.image || "",
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
