"use client";

import { SidebarMenuAction } from "ui/sidebar";
import Link from "next/link";
import { SidebarMenuButton } from "ui/sidebar";
import { SidebarGroupContent, SidebarMenu, SidebarMenuItem } from "ui/sidebar";
import { SidebarGroup, SidebarGroupLabel } from "ui/sidebar";
import { PlusIcon, Music } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { useCharacters } from "@/hooks/queries/use-characters";

export function AppSidebarCharacterMode() {
  const mounted = useMounted();
  const [characters] = appStore(
    useShallow((state) => [state.characterList || []]),
  );
  
  // Fetch characters and load into store
  useCharacters({ type: "private" });

  if (!mounted) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Character Mode</SidebarGroupLabel>
      <SidebarGroupContent className="group-data-[collapsible=icon]:hidden">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="font-semibold">
              <Link href="/characters">
                <Music className="size-4" />
                <span>My Characters</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuAction className="group-hover:opacity-100 opacity-0 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <PlusIcon className="size-4" />
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  Create Character
                </TooltipContent>
              </Tooltip>
            </SidebarMenuAction>
          </SidebarMenuItem>

          {characters.length === 0 ? (
            <div className="px-2 mt-1">
              <Link href="/characters">
                <div className="bg-input/40 py-6 px-4 rounded-lg text-xs overflow-hidden cursor-pointer hover:bg-input/60 transition-colors">
                  <div className="gap-1 z-10">
                    <p className="font-semibold mb-2">No Characters Yet</p>
                    <p className="text-muted-foreground">
                      Create your first character to get started
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col">
              {characters.map((character) => (
                <SidebarMenuItem key={character.id} className="px-2 cursor-pointer">
                  <SidebarMenuButton asChild>
                    <Link href={`/character/${character.id}`}>
                      <span>{character.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
