import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { checkDailyUploadLimitRest } from "@/lib/upload-limiter.rest";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uploadLimit = await checkDailyUploadLimitRest(session.user.id);

    return NextResponse.json({
      remaining: uploadLimit.remaining,
      limit: uploadLimit.limit,
      resetTime: uploadLimit.resetTime.toISOString(),
    });
  } catch (error) {
    console.error("Failed to get upload limit:", error);
    return NextResponse.json(
      { error: "Failed to get upload limit" },
      { status: 500 },
    );
  }
}
