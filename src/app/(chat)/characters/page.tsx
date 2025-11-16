import { CharactersList } from "@/components/character/characters-list";
import { getSession } from "auth/server";
import { notFound } from "next/navigation";
import { characterRepository } from "@/lib/db/repository";

// Force dynamic rendering to avoid static generation issues with session
export const dynamic = "force-dynamic";

export default async function CharactersPage() {
  const session = await getSession();

  if (!session?.user.id) {
    notFound();
  }

  try {
    // Fetch user's characters (both public and private)
    const myCharacters = await characterRepository.getCharactersByUserId(
      session.user.id,
    );

    // Fetch public characters from other users
    const allPublicCharacters = await characterRepository.getPublicCharacters();
    const sharedCharacters = allPublicCharacters.filter(
      (c) => c.userId !== session.user.id,
    );

    return (
      <CharactersList
        initialMyCharacters={myCharacters as any}
        initialSharedCharacters={sharedCharacters as any}
        userId={session.user.id}
        userRole={session.user.role || "user"}
      />
    );
  } catch (error) {
    console.error("Error fetching characters:", error);
    return (
      <CharactersList
        initialMyCharacters={[]}
        initialSharedCharacters={[]}
        userId={session.user.id}
        userRole={session.user.role || "user"}
      />
    );
  }
}
