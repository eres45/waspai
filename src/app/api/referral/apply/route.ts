import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { userRepository } from "@/lib/db/repository";
import { cookies } from "next/headers";

const PUBLIC_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "zoho.com",
  "proton.me",
  "protonmail.com",
  "mail.com",
  "yandex.com",
  "gmx.com",
]);

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const referredUserId = session.user.id;
    const referredUser = await userRepository.getUserById(referredUserId);

    if (!referredUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. If user already has a referrer, do nothing
    if (referredUser.referredBy) {
      return NextResponse.json({
        success: true,
        message: "Referral already applied",
      });
    }

    // 2. Extract referral code from request body or cookie
    let refCode: string | null = null;
    try {
      const body = await request.json().catch(() => ({}));
      refCode = body.ref || null;
    } catch {
      // Ignore body parse errors if empty
    }

    // Helper to clear the cookie safely
    const clearCookie = async () => {
      try {
        const cookieStore = await cookies();
        cookieStore.delete("wasp_ref");
      } catch (err) {
        console.warn(
          "[Referral] Safe cookie clear skipped (no request context):",
          err,
        );
      }
    };

    if (!refCode) {
      try {
        const cookieStore = await cookies();
        refCode = cookieStore.get("wasp_ref")?.value || null;
      } catch (err) {
        console.warn(
          "[Referral] Safe cookie read skipped (no request context):",
          err,
        );
      }
    }

    if (!refCode) {
      return NextResponse.json({
        success: true,
        message: "No pending referral code found",
      });
    }

    // 3. Find the referrer by referral code
    const referrer = await userRepository.getUserByReferralCode(refCode);
    if (!referrer) {
      // Clear cookie anyway since it's invalid
      await clearCookie();
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 400 },
      );
    }

    // 4. Prevent self-referral and email domain abuse
    if (referrer.id === referredUserId) {
      await clearCookie();
      return NextResponse.json(
        { error: "Self-referral is not allowed" },
        { status: 400 },
      );
    }

    // Prevent same-IP referral abuse (ignoring local loopback IPs for testing/development)
    const referredIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "127.0.0.1";

    const referrerIp = (referrer as any).lastSignInIp;

    if (
      referredIp &&
      referrerIp &&
      referredIp !== "127.0.0.1" &&
      referredIp !== "localhost" &&
      referredIp !== "::1" &&
      referredIp === referrerIp
    ) {
      await clearCookie();
      return NextResponse.json(
        {
          error:
            "Referrals from the same network connection are not allowed to prevent abuse",
        },
        { status: 400 },
      );
    }

    const referrerDomain = referrer.email?.split("@")[1]?.toLowerCase();
    const referredDomain = referredUser.email?.split("@")[1]?.toLowerCase();

    if (
      referrerDomain &&
      referredDomain &&
      referrerDomain === referredDomain &&
      !PUBLIC_DOMAINS.has(referrerDomain)
    ) {
      await clearCookie();
      return NextResponse.json(
        {
          error:
            "Referrals within the same email domain are not allowed to prevent abuse",
        },
        { status: 400 },
      );
    }

    // 5. Update referred user to mark they were referred
    await userRepository.updateReferralInfo(referredUserId, {
      referredBy: refCode,
    });

    // 6. Increment referrer's count and calculate rewards
    const newCount = (referrer.referralCount || 0) + 1;
    let rewardClaimed = referrer.referralRewardClaimed || "none";
    let widgetHidden = referrer.referralWidgetHidden || false;
    let newTier = referrer.tier || "free";
    let newExpiry = referrer.tierExpiresAt
      ? new Date(referrer.tierExpiresAt)
      : null;

    if (newCount >= 3 && rewardClaimed === "none") {
      // Grant 14 days Pro
      newTier = "pro";
      const baseDate =
        newExpiry && newExpiry > new Date() ? newExpiry : new Date();
      newExpiry = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      rewardClaimed = "14days";
    }

    if (newCount >= 5) {
      widgetHidden = true;
      if (rewardClaimed === "14days") {
        // Grant 1 month Pro on top of 14 days
        newTier = "pro";
        const baseDate =
          newExpiry && newExpiry > new Date() ? newExpiry : new Date();
        newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        rewardClaimed = "1month";
      } else if (rewardClaimed === "none") {
        // Just in case they jump from 0 to 5+ directly, grant both cumulative (44 days)
        newTier = "pro";
        const baseDate =
          newExpiry && newExpiry > new Date() ? newExpiry : new Date();
        newExpiry = new Date(baseDate.getTime() + 44 * 24 * 60 * 60 * 1000);
        rewardClaimed = "1month";
      }
    }

    await userRepository.updateReferralInfo(referrer.id, {
      referralCount: newCount,
      referralRewardClaimed: rewardClaimed,
      referralWidgetHidden: widgetHidden,
      tier: newTier,
      tierExpiresAt: newExpiry,
    });

    // 7. Clear the referral cookie
    await clearCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/referral/apply] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
