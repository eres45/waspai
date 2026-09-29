import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { PromoService } from "@/lib/promo/promo-service";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please sign in or create an account to redeem your promo code.",
          needsAuth: true,
        },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Please enter a promo code." },
        { status: 400 },
      );
    }

    const result = await PromoService.redeemPromoCode(code, {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.name || undefined,
      tier: (session.user as any)?.tier || "free",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 },
      );
    }

    // Update the local auth-user cookie so client session reflects tier change instantly
    try {
      const cookieStore = await cookies();
      const enrichedUser = {
        ...session.user,
        tier: result.plan,
        tier_expires_at: result.expiresAt,
      };

      cookieStore.set("auth-user", JSON.stringify(enrichedUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    } catch (cookieErr) {
      console.warn(
        "[promo/redeem] Could not update session cookie:",
        cookieErr,
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      plan: result.plan,
      durationMonths: result.durationMonths,
      expiresAt: result.expiresAt,
    });
  } catch (err: any) {
    console.error("[promo/redeem] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "An unexpected error occurred while redeeming.",
      },
      { status: 500 },
    );
  }
}
