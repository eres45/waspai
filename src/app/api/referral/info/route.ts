import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { userRepository } from "@/lib/db/repository";
import crypto from "crypto";

export async function GET() {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const user = await userRepository.getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let referralCode = (user as any).referralCode;
    let referralCount = (user as any).referralCount ?? 0;
    let referralRewardClaimed = (user as any).referralRewardClaimed ?? "none";
    let referralWidgetHidden = (user as any).referralWidgetHidden ?? false;

    // Generate referralCode if missing (legacy users)
    if (!referralCode) {
      referralCode = crypto.randomUUID();
      const updated = await userRepository.updateReferralInfo(userId, {
        referralCode,
      });
      referralCount = (updated as any).referralCount ?? 0;
      referralRewardClaimed = (updated as any).referralRewardClaimed ?? "none";
      referralWidgetHidden = (updated as any).referralWidgetHidden ?? false;
    }

    const inviteLink = `https://waspai.in/sign-up?ref=${referralCode}`;

    return NextResponse.json({
      referralCode,
      referralCount,
      referralRewardClaimed,
      referralWidgetHidden,
      inviteLink,
    });
  } catch (error) {
    console.error("[GET /api/referral/info] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
