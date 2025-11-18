import EditCharacter from "@/components/character/edit-character";
import { getSession } from "auth/server";
import { redirect } from "next/navigation";

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user.id) {
    redirect("/sign-in");
  }

  // For new characters, pass no initial data
  if (id === "new") {
    return <EditCharacter />;
  }

  // TODO: Fetch character data from database when repository is ready
  // For now, just render the edit component
  return <EditCharacter key={id} characterId={id} />;
}
