import { NextRequest, NextResponse } from "next/server";
import { checkAdminCredentials, setAdminSession } from "lib/admin-panel/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const valid = checkAdminCredentials(email, password);
    if (!valid) {
      // Artificial delay to slow brute-force
      await new Promise((r) => setTimeout(r, 1000));
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    await setAdminSession(email.toLowerCase().trim());
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin-panel] login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const { clearAdminSession } = await import("lib/admin-panel/auth");
  await clearAdminSession();
  return NextResponse.json({ success: true });
}
