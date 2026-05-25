import { skillRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { z } from "zod";
import { NextResponse } from "next/server";

const RateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: skillId } = await params;

  try {
    const body = await request.json();
    const { rating, review } = RateSchema.parse(body);

    const skillRating = await skillRepository.rateSkill(
      session.user.id,
      skillId,
      rating,
      review,
    );
    return NextResponse.json(skillRating);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }
    console.error(`[Skills API] POST rate [${skillId}] error:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: skillId } = await params;
  try {
    const ratings = await skillRepository.getSkillRatings(skillId);
    return NextResponse.json(ratings);
  } catch (error) {
    console.error(`[Skills API] GET ratings [${skillId}] error:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
