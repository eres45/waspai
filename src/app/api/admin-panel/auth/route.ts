import { checkAdminCredentials, setAdminSession } from "lib/admin-panel/auth";
import { NextRequest, NextResponse } from "next/server";

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

    // Promote currently logged-in user in database and update cookie
    try {
      const { getSession } = await import("auth/server");
      const session = await getSession();
      if (session?.user?.id) {
        const { supabaseRest } = await import("lib/db/supabase-rest");
        await supabaseRest
          .from("user")
          .update({ role: "admin" })
          .eq("id", session.user.id);

        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const updatedUser = { ...session.user, role: "admin" };
        cookieStore.set("auth-user", JSON.stringify(updatedUser), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
        });
      }
    } catch (e) {
      console.error("[admin-panel] Failed to promote session user:", e);
    }

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
