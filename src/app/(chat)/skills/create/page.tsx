import { getSession } from "auth/server";
import { redirect } from "next/navigation";
import { CreateSkillForm } from "@/components/skill/create-skill-form";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Skill — Skill Library",
  description: "Create a new AI skill and share it with the community.",
};

export default async function CreateSkillPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return <CreateSkillForm />;
}
