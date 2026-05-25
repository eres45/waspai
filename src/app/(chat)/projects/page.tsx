import { getSession } from "auth/server";
import { redirect } from "next/navigation";
import { ProjectsDashboard } from "@/components/project/projects-dashboard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Projects",
  description:
    "View and manage all your deployed website subdomains and project chat folders.",
};

export default async function ProjectsPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return <ProjectsDashboard />;
}
