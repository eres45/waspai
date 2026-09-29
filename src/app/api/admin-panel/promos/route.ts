import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "lib/admin-panel/auth";
import { getSession } from "auth/server";
import { PromoService } from "@/lib/promo/promo-service";

async function isAuthorizedAdmin(): Promise<boolean> {
  const adminEmail = await getAdminSession();
  if (adminEmail) return true;

  try {
    const session = await getSession();
    if (session?.user && (session.user as any).role === "admin") {
      return true;
    }
  } catch {}

  return false;
}

export async function GET(_req: NextRequest) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [promos, redemptions] = await Promise.all([
      PromoService.listPromoCodes(),
      PromoService.listRedemptions(),
    ]);

    const activeCount = promos.filter((p) => p.isActive).length;
    const totalRedemptions = promos.reduce(
      (sum, p) => sum + (p.timesRedeemed || 0),
      0,
    );

    return NextResponse.json({
      success: true,
      promos,
      redemptions,
      stats: {
        totalCodes: promos.length,
        activeCodes: activeCount,
        totalRedemptions,
        proCodes: promos.filter((p) => p.plan === "pro").length,
        maxCodes: promos.filter((p) => p.plan === "max").length,
      },
    });
  } catch (err: any) {
    console.error("[admin-panel/promos GET] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch promo codes" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      code,
      plan = "pro",
      durationMonths = 1,
      maxUses = 1,
      expiresAt,
      notes,
    } = body;

    const adminEmail = (await getAdminSession()) || "Admin";

    const newPromo = await PromoService.createPromoCode({
      code: code ? String(code).trim().toUpperCase() : undefined,
      plan: plan === "max" ? "max" : "pro",
      durationMonths: Math.max(1, Number(durationMonths) || 1),
      maxUses: Number(maxUses),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      notes: notes ? String(notes).trim() : undefined,
      createdBy: adminEmail,
    });

    return NextResponse.json({
      success: true,
      message: `Promo code ${newPromo.code} generated successfully!`,
      promo: newPromo,
    });
  } catch (err: any) {
    console.error("[admin-panel/promos POST] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create promo code" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Promo ID is required" },
        { status: 400 },
      );
    }

    await PromoService.deletePromoCode(id);
    return NextResponse.json({
      success: true,
      message: "Promo code deleted successfully",
    });
  } catch (err: any) {
    console.error("[admin-panel/promos DELETE] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete promo code" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id, isActive } = body;

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "id and isActive boolean required" },
        { status: 400 },
      );
    }

    const updated = await PromoService.togglePromoActive(id, isActive);
    return NextResponse.json({
      success: true,
      message: `Promo code ${isActive ? "activated" : "paused"}`,
      promo: updated,
    });
  } catch (err: any) {
    console.error("[admin-panel/promos PATCH] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update promo code" },
      { status: 500 },
    );
  }
}
