import { skillRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const installed = await skillRepository.getInstalledSkills(session.user.id);
    return NextResponse.json(installed);
  } catch (error) {
    console.error("[Skills API] GET installed error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
