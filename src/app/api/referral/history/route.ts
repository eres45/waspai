import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { userRepository } from "@/lib/db/repository";
import { supabaseServer } from "@/lib/supabase-server";

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "Anonymous";
  const [localPart, domain] = email.split("@");
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart.slice(0, 2)}***${localPart.slice(-1)}@${domain}`;
}

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

    const referralCode = (user as any).referralCode;
    const referralCount = (user as any).referralCount ?? 0;
    const referralRewardClaimed = (user as any).referralRewardClaimed ?? "none";
    const tier = user.tier ?? "free";
    const tierExpiresAt = (user as any).tierExpiresAt ?? null;
    const inviteLink = referralCode
      ? `https://waspai.in/sign-up?ref=${referralCode}`
      : "";

    let referrals: Array<{
      id: string;
      name: string;
      maskedEmail: string;
      joinedAt: string;
    }> = [];

    if (referralCode) {
      const { data: referredUsers, error } = await supabaseServer
        .from("user")
        .select("id, name, email, created_at")
        .eq("referred_by", referralCode)
        .order("created_at", { ascending: false });

      if (!error && referredUsers) {
        referrals = referredUsers.map((u: any) => ({
          id: u.id,
          name: u.name || "WaspAI Friend",
          maskedEmail: maskEmail(u.email || ""),
          joinedAt: u.created_at || new Date().toISOString(),
        }));
      }
    }

    return NextResponse.json({
      referralCode,
      referralCount,
      referralRewardClaimed,
      tier,
      tierExpiresAt,
      inviteLink,
      referrals,
    });
  } catch (error) {
    console.error("[GET /api/referral/history] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
