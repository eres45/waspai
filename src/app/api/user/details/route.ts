import { getSession } from "auth/server";
import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/lib/db/repository";
import logger from "logger";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      logger.warn("No session found for user details request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await userRepository.getUserById(session.user.id);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Capture and track user IP address
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "127.0.0.1";

    let lastSignInIp = (dbUser as any).lastSignInIp;
    if (ip && ip !== "unknown" && lastSignInIp !== ip) {
      await userRepository.updateReferralInfo(dbUser.id, { lastSignInIp: ip });
      lastSignInIp = ip;
    }

    // Check for referral trial tier expiration
    let currentTier = dbUser.tier || "free";
    if (dbUser.tierExpiresAt && new Date(dbUser.tierExpiresAt) < new Date()) {
      await userRepository.updateReferralInfo(dbUser.id, {
        tier: "free",
        tierExpiresAt: null,
      });
      currentTier = "free";
    }

    // Generate referralCode if missing (e.g., legacy accounts)
    let referralCode = dbUser.referralCode;
    if (!referralCode) {
      referralCode = crypto.randomUUID();
      await userRepository.updateReferralInfo(dbUser.id, { referralCode });
    }

    // ── Auto-repair missing_sync placeholder ──────────────────────────────────
    // If the DB has a placeholder email from the FK-violation fallback but the
    // session has the real OAuth email, patch the DB record right now so the
    // user sees their correct name/email immediately and on every subsequent
    // request.
    const isPlaceholderEmail = dbUser.email?.startsWith("missing_sync_");
    const sessionEmail = session.user.email || "";
    const sessionName = (session.user as any).name || "";

    if (
      isPlaceholderEmail &&
      sessionEmail &&
      !sessionEmail.startsWith("missing_sync_")
    ) {
      logger.warn(
        `[user/details] Repairing missing_sync placeholder for user ${dbUser.id}`,
      );
      try {
        await userRepository.updateUserDetails({
          userId: dbUser.id,
          email: sessionEmail,
          name: sessionName || dbUser.name || "",
        });
      } catch (repairErr) {
        logger.error(
          "[user/details] Failed to repair placeholder email:",
          repairErr,
        );
      }
    }

    // Use real session values as immediate fallback (so UI is correct even
    // before the DB write above completes on first hit).
    const resolvedEmail =
      isPlaceholderEmail && sessionEmail ? sessionEmail : dbUser.email || "";
    const resolvedName =
      (!dbUser.name || dbUser.name === "Synced User") && sessionName
        ? sessionName
        : dbUser.name || resolvedEmail.split("@")[0] || "User";
    // ─────────────────────────────────────────────────────────────────────────

    const now = new Date().toISOString();

    const userData = {
      id: dbUser.id,
      email: resolvedEmail,
      name: resolvedName,
      image: dbUser.image || null,
      createdAt: dbUser.createdAt || now,
      updatedAt: dbUser.updatedAt || now,
      lastLogin: dbUser.lastLogin || now,
      emailVerified: dbUser.emailVerified || false,
      role: dbUser.role || "user",
      tier: currentTier,
      referralCode: referralCode,
      referredBy: dbUser.referredBy || null,
      referralCount: dbUser.referralCount || 0,
      referralRewardClaimed: dbUser.referralRewardClaimed || "none",
      referralWidgetHidden: dbUser.referralWidgetHidden || false,
      tierExpiresAt: dbUser.tierExpiresAt || null,
      lastSignInIp: lastSignInIp || null,
    };

    return NextResponse.json(userData);
  } catch (error: any) {
    logger.error("Error fetching user details:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to get user details",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
