import { skillRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: skillId } = await params;

  try {
    // Check skill exists
    const skill = await skillRepository.getSkillById(skillId);
    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Check tier requirement
    const userTier = (session.user as any).tier ?? "free";
    if (skill.tierRequired === "pro" && !["pro", "max"].includes(userTier)) {
      return NextResponse.json(
        { error: "tier_required", tierRequired: "pro" },
        { status: 403 },
      );
    }
    if (skill.tierRequired === "max" && userTier !== "max") {
      return NextResponse.json(
        { error: "tier_required", tierRequired: "max" },
        { status: 403 },
      );
    }

    const userSkill = await skillRepository.installSkill(
      session.user.id,
      skillId,
    );
    // Increment install count (fire and forget)
    skillRepository.incrementInstallCount(skillId).catch(console.error);

    return NextResponse.json(userSkill, { status: 201 });
  } catch (error) {
    console.error(`[Skills API] POST install [${skillId}] error:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: skillId } = await params;

  try {
    await skillRepository.uninstallSkill(session.user.id, skillId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[Skills API] DELETE install [${skillId}] error:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
