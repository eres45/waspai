"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "ui/button";
import { PlusIcon, ArrowUpRight, Globe, Lock, MessageCircle } from "lucide-react";
import { BackgroundPaths } from "ui/background-paths";
import { Card, CardDescription, CardHeader, CardTitle } from "ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { generateUUID } from "lib/utils";
import { createThreadAction } from "@/app/api/chat/actions";
import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";

interface Character {
  id: string;
  name: string;
  description: string;
  personality?: string;
  privacy?: "public" | "private";
  icon?: {
    type?: string;
    value: string;
    style?: {
      backgroundColor: string;
    };
  };
}

interface CharactersListProps {
  initialMyCharacters: Character[];
  initialSharedCharacters: Character[];
  userId: string;
  userRole?: string;
}

export function CharactersList({
  initialMyCharacters,
  initialSharedCharacters,
  userId,
  userRole,
}: CharactersListProps) {
  const router = useRouter();
  const [appStoreMutate] = appStore(
    useShallow((state) => [state.mutate]),
  );

  const handleCreateCharacter = () => {
    router.push("/character/new");
  };

  const handleCharacterClick = (characterId: string) => {
    router.push(`/character/${characterId}`);
  };

  const handleChatWithCharacter = useCallback(
    async (e: React.MouseEvent, character: Character) => {
      e.stopPropagation();
      try {
        // Generate a new thread ID
        const newThreadId = generateUUID();

        // Create thread on the backend
        await createThreadAction(newThreadId);

        // Store character info in session/local storage for the chat page to use
        const characterInfo = {
          id: character.id,
          name: character.name,
          description: character.description,
          personality: character.personality,
        };
        
        // Store in sessionStorage so chat page can access it
        sessionStorage.setItem(`character_${newThreadId}`, JSON.stringify(characterInfo));

        // Add the character as a mention in the new thread
        const characterMention = {
          type: "character" as const,
          name: character.name,
          characterId: character.id,
          description: character.description,
          personality: character.personality,
          icon: character.icon,
        };

        appStoreMutate((prev) => {
          return {
            currentThreadId: newThreadId,
            // Set Pollinations AI GPT model for character chat (use display names)
            chatModel: {
              provider: "OpenAI",
              model: "ChatGPT GPT-5 Nano",
            },
            threadMentions: {
              ...prev.threadMentions,
              [newThreadId]: [characterMention],
            },
          };
        });

        // Redirect to chat with the new thread ID
        router.push(`/chat/${newThreadId}`);
      } catch (error) {
        console.error("Error creating thread:", error);
        toast.error("Failed to create chat thread");
      }
    },
    [router, appStoreMutate],
  );

  const myCharacters = initialMyCharacters || [];
  const sharedCharacters = initialSharedCharacters || [];

  // Separate characters by privacy
  const publicCharacters = myCharacters.filter((c) => c.privacy === "public");
  const privateCharacters = myCharacters.filter((c) => c.privacy === "private");

  const CharacterCard = ({ character }: { character: Character }) => (
    <div
      onClick={() => handleCharacterClick(character.id)}
      className="bg-card border border-border/40 rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            backgroundColor: character.icon?.style?.backgroundColor,
          }}
        >
          {character.icon?.type === "image" ? (
            <img src={character.icon.value} alt={character.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            character.icon?.value || "🎭"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{character.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {character.description}
          </p>
        </div>
      </div>
      {character.personality && (
        <div className="text-xs text-foreground/70 line-clamp-2 bg-muted/30 p-2 rounded mb-3">
          {character.personality}
        </div>
      )}
      <Button
        onClick={(e) => handleChatWithCharacter(e, character)}
        size="sm"
        className="w-full gap-2"
        variant="default"
      >
        <MessageCircle className="size-4" />
        Chat with {character.name}
      </Button>
    </div>
  );

  const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <Card className="relative bg-secondary overflow-hidden cursor-pointer hover:bg-input transition-colors h-[196px]">
      <div className="absolute inset-0 w-full h-full opacity-50">
        <BackgroundPaths />
      </div>
      <CardHeader className="relative z-10 flex flex-col items-center justify-center h-full text-center">
        <CardTitle>
          <h1 className="text-lg font-bold">{title}</h1>
        </CardTitle>
        <CardDescription className="mt-2">
          <p>{description}</p>
        </CardDescription>
        <div className="mt-4">
          <Button onClick={handleCreateCharacter} variant="ghost" size="lg">
            <PlusIcon className="size-4 mr-2" />
            Create Character
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Characters</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage your characters
          </p>
        </div>
        <Button onClick={handleCreateCharacter} className="gap-2">
          <PlusIcon className="size-4" />
          Create Character
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full space-y-6">
          {/* My Characters Tabs */}
          <div>
            <Tabs defaultValue="public" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="public" className="gap-2">
                  <Globe className="size-4" />
                  Public ({publicCharacters.length})
                </TabsTrigger>
                <TabsTrigger value="private" className="gap-2">
                  <Lock className="size-4" />
                  Private ({privateCharacters.length})
                </TabsTrigger>
              </TabsList>

              {/* Public Tab */}
              <TabsContent value="public" className="space-y-4">
                {publicCharacters.length === 0 ? (
                  <EmptyState
                    title="No Public Characters"
                    description="Create your first public character to share with others"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {publicCharacters.map((character) => (
                      <CharacterCard key={character.id} character={character} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Private Tab */}
              <TabsContent value="private" className="space-y-4">
                {privateCharacters.length === 0 ? (
                  <EmptyState
                    title="No Private Characters"
                    description="Create your first private character for personal use"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {privateCharacters.map((character) => (
                      <CharacterCard key={character.id} character={character} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Shared Characters Section */}
          {sharedCharacters.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Shared Characters</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sharedCharacters.map((character) => (
                  <CharacterCard key={character.id} character={character} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
