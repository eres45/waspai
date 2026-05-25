import { getSession } from "auth/server";
import { redirect } from "next/navigation";
import { SkillLibrary } from "@/components/skill/skill-library";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skill Library",
  description:
    "Browse, install, and create AI skills to supercharge your chat experience with specialized expertise.",
};

export default async function SkillsPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return <SkillLibrary userId={session.user.id} />;
}
