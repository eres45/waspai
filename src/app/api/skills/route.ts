import { skillRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { z } from "zod";
import type { SkillCategory, SkillTier } from "@/types/skill";
import { NextResponse } from "next/server";

const ListQuerySchema = z.object({
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
  search: z.string().optional(),
  featured: z.string().optional(),
  tierRequired: z.enum(["free", "pro", "max"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const CreateSkillSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(64)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    ),
  title: z.string().min(2).max(100),
  description: z.string().min(10).max(500),
  content: z.string().min(20),
  category: z.enum([
    "productivity",
    "coding",
    "media",
    "writing",
    "research",
    "automation",
    "other",
  ]),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(true),
  icon: z.string().default("🔧"),
  toolsRequired: z.array(z.string()).default([]),
  tierRequired: z.enum(["free", "pro", "max"]).default("free"),
  version: z.string().default("1.0.0"),
});

export async function GET(request: Request) {
  const session = await getSession();
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);

  try {
    const query = ListQuerySchema.parse(params);
    const skills = await skillRepository.listSkills({
      category: query.category as SkillCategory | undefined,
      search: query.search,
      featured: query.featured === "true" ? true : undefined,
      tierRequired: query.tierRequired as SkillTier | undefined,
      limit: query.limit,
      offset: query.offset,
      userId: session?.user?.id,
    });

    return NextResponse.json(skills);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.message },
        { status: 400 },
      );
    }
    console.error("[Skills API] GET list error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = CreateSkillSchema.parse(body);

    const skill = await skillRepository.createSkill({
      ...data,
      authorId: session.user.id,
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes("unique")) {
      return NextResponse.json(
        {
          error:
            "A skill with this slug already exists. Choose a different name.",
        },
        { status: 409 },
      );
    }
    console.error("[Skills API] POST create error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
