import { getSession } from "auth/server";
import { redirect, notFound } from "next/navigation";
import { skillRepository } from "lib/db/repository";
import { SkillDetail } from "@/components/skill/skill-detail";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const skill = await skillRepository.getSkillById(id);
  return {
    title: skill ? `${skill.title} — Skill Library` : "Skill Not Found",
    description: skill?.description,
  };
}

export default async function SkillDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { id } = await params;

  const [skill, ratings, userRating] = await Promise.all([
    skillRepository.getSkillById(id, session.user.id),
    skillRepository.getSkillRatings(id),
    skillRepository.getUserRating(session.user.id, id),
  ]);

  if (!skill) {
    notFound();
  }

  return (
    <SkillDetail
      skill={skill}
      ratings={ratings}
      userId={session.user.id}
      userRating={userRating}
    />
  );
}
