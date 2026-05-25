import { skillRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { z } from "zod";
import { NextResponse } from "next/server";

const UpdateSkillSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  content: z.string().min(20).optional(),
  category: z
    .enum([
      "productivity",
      "coding",
      "media",
      "writing",
      "research",
      "automation",
      "other",
    ])
    .optional(),
  tags: z.array(z.string()).optional(),
  icon: z.string().optional(),
  toolsRequired: z.array(z.string()).optional(),
  tierRequired: z.enum(["free", "pro", "max"]).optional(),
  isPublic: z.boolean().optional(),
  version: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id } = await params;

  try {
    const skill = await skillRepository.getSkillById(id, session?.user?.id);
    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }
    return NextResponse.json(skill);
  } catch (error) {
    console.error(`[Skills API] GET [${id}] error:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const body = await request.json();
    const data = UpdateSkillSchema.parse(body);

    const updated = await skillRepository.updateSkill(
      id,
      session.user.id,
      data,
    );
    if (!updated) {
      return NextResponse.json(
        { error: "Skill not found or you do not have permission to edit it" },
        { status: 404 },
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }
    console.error(`[Skills API] PUT [${id}] error:`, error);
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
  const { id } = await params;

  try {
    const deleted = await skillRepository.deleteSkill(id, session.user.id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Skill not found or you do not have permission to delete it" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[Skills API] DELETE [${id}] error:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
