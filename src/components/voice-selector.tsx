"use client";

import { useMemo, useState } from "react";
import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import {
  getAllVoiceOptions,
  getVoiceDisplayName,
  VoiceOption,
} from "lib/ai/speech/custom-tts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Button } from "ui/button";
import { CheckIcon, ChevronDown, Search, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "lib/utils";

interface VoiceSelectorProps {
  className?: string;
  variant?: "pill" | "button" | "icon";
}

export function VoiceSelector({
  className,
  variant = "pill",
}: VoiceSelectorProps) {
  const [voiceChat, appStoreMutate] = appStore(
    useShallow((state) => [state.voiceChat, state.mutate]),
  );

  const activeVoice =
    voiceChat.options.providerOptions?.voice ||
    (voiceChat.options.providerOptions as any)?.model ||
    "fish-female";

  const [searchQuery, setSearchQuery] = useState("");
  const allVoices = useMemo(() => getAllVoiceOptions(), []);

  // Filter voices when search query is entered
  const filteredVoices = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allVoices.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q) ||
        v.language.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.gender.toLowerCase().includes(q) ||
        (v.badge && v.badge.toLowerCase().includes(q)),
    );
  }, [allVoices, searchQuery]);

  // Group non-search voices into clean organized categories without provider names
  const categorized = useMemo(() => {
    const featured = allVoices.filter(
      (v) =>
        v.id === "fish-female" ||
        v.id === "fish-male" ||
        v.id === "woino-magnus" ||
        v.id === "woino-aditi" ||
        v.id === "woino-aarush" ||
        v.id === "en-US-JennyNeural" ||
        v.id === "en-US-GuyNeural" ||
        v.id === "nova",
    );
    const english = allVoices.filter(
      (v) =>
        v.language.toLowerCase().includes("english") &&
        !featured.some((f) => f.id === v.id),
    );
    const hindi = allVoices.filter(
      (v) =>
        v.language.toLowerCase().includes("hindi") &&
        !featured.some((f) => f.id === v.id),
    );
    const southIndian = allVoices.filter((v) =>
      ["kannada", "tamil", "telugu", "malayalam"].some((lang) =>
        v.language.toLowerCase().includes(lang),
      ),
    );
    const regionalIndian = allVoices.filter((v) =>
      ["bengali", "marathi", "gujarati", "punjabi"].some((lang) =>
        v.language.toLowerCase().includes(lang),
      ),
    );
    const globalVoices = allVoices.filter(
      (v) =>
        v.language.toLowerCase().includes("spanish") ||
        ["alloy", "shimmer", "echo", "onyx", "fable"].includes(v.id),
    );

    return {
      featured,
      english,
      hindi,
      southIndian,
      regionalIndian,
      globalVoices,
    };
  }, [allVoices]);

  const selectVoice = (voiceId: string, voiceName: string) => {
    appStoreMutate({
      voiceChat: {
        ...voiceChat,
        options: {
          provider: "custom-tts",
          providerOptions: {
            voice: voiceId,
          },
        },
      },
    });
    toast.success(`Voice set to ${voiceName}`);
    setSearchQuery("");
  };

  const activeDisplayName = useMemo(() => {
    const matched = allVoices.find((v) => v.id === activeVoice);
    if (matched) {
      return matched.name;
    }
    return getVoiceDisplayName(activeVoice);
  }, [allVoices, activeVoice]);

  const renderVoiceItem = (voice: VoiceOption) => {
    const isSelected =
      voice.id === activeVoice ||
      (activeVoice.startsWith("woino-") && voice.id === activeVoice.slice(6)) ||
      (voice.id.startsWith("woino-") && voice.id.slice(6) === activeVoice);

    return (
      <DropdownMenuItem
        key={voice.id}
        className={cn(
          "cursor-pointer flex items-center justify-between py-1.5 px-2.5 rounded-md text-xs",
          isSelected && "bg-accent/50 font-medium",
        )}
        onClick={() => selectVoice(voice.id, voice.name)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "size-1.5 rounded-full shrink-0",
              voice.gender === "female" ? "bg-pink-400" : "bg-blue-400",
            )}
          />
          <span className="truncate">{voice.name}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {voice.language}
          </span>
          {voice.badge && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-secondary text-secondary-foreground font-mono shrink-0">
              {voice.badge}
            </span>
          )}
        </div>
        {isSelected && (
          <CheckIcon className="size-3.5 text-primary shrink-0 ml-2" />
        )}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "pill" ? (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 px-2.5 gap-1.5 text-xs font-normal bg-secondary/30 hover:bg-secondary/60 border-border/50",
              className,
            )}
          >
            <Volume2 className="size-3.5 text-primary shrink-0" />
            <span className="truncate max-w-[130px] sm:max-w-[190px]">
              {activeDisplayName}
            </span>
            <ChevronDown className="size-3 text-muted-foreground shrink-0 opacity-70" />
          </Button>
        ) : variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8 text-foreground", className)}
          >
            <Volume2 className="size-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2 text-xs", className)}
          >
            <Volume2 className="size-4 text-primary" />
            <span>Voice: {activeDisplayName}</span>
            <ChevronDown className="size-3.5" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="end"
        className="w-72 max-h-[460px] overflow-hidden flex flex-col p-1 shadow-lg"
      >
        {/* Search header */}
        <div className="p-1.5 border-b border-border/50 shrink-0">
          <div className="relative flex items-center">
            <Search className="size-3.5 absolute left-2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search 230+ voices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full pl-7 pr-6 py-1 text-xs bg-muted/40 rounded-md border border-input/40 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto flex-1 p-1">
          {searchQuery.trim() ? (
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[11px] text-muted-foreground px-2 py-1">
                Matching voices ({filteredVoices.length})
              </DropdownMenuLabel>
              {filteredVoices.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  No voices match &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredVoices.map(renderVoiceItem)
              )}
            </DropdownMenuGroup>
          ) : (
            <DropdownMenuGroup>
              {/* 1. Featured Voices */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer text-xs py-1.5 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500" />
                  <span className="font-medium">⭐ Featured Voices</span>
                  <span className="text-[10px] text-muted-foreground ml-auto pr-1">
                    {categorized.featured.length}
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-64 max-h-80 overflow-y-auto p-1">
                    {categorized.featured.map(renderVoiceItem)}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator className="my-1" />

              {/* 2. English Voices */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer text-xs py-1.5 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500" />
                  <span>English Voices</span>
                  <span className="text-[10px] text-muted-foreground ml-auto pr-1">
                    {categorized.english.length}
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-64 max-h-80 overflow-y-auto p-1">
                    {categorized.english.map(renderVoiceItem)}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* 3. Hindi Voices */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer text-xs py-1.5 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-500" />
                  <span>Hindi Voices</span>
                  <span className="text-[10px] text-muted-foreground ml-auto pr-1">
                    {categorized.hindi.length}
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-64 max-h-80 overflow-y-auto p-1">
                    {categorized.hindi.map(renderVoiceItem)}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* 4. South Indian */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer text-xs py-1.5 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500" />
                  <span>South Indian Voices</span>
                  <span className="text-[10px] text-muted-foreground ml-auto pr-1">
                    {categorized.southIndian.length}
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-64 max-h-80 overflow-y-auto p-1">
                    {categorized.southIndian.map(renderVoiceItem)}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* 5. Regional Indian */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer text-xs py-1.5 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500" />
                  <span>Regional Indian Voices</span>
                  <span className="text-[10px] text-muted-foreground ml-auto pr-1">
                    {categorized.regionalIndian.length}
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-64 max-h-80 overflow-y-auto p-1">
                    {categorized.regionalIndian.map(renderVoiceItem)}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* 6. Global & Spanish */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer text-xs py-1.5 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-gradient-to-r from-rose-400 to-red-500" />
                  <span>Global & Other Voices</span>
                  <span className="text-[10px] text-muted-foreground ml-auto pr-1">
                    {categorized.globalVoices.length}
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-64 max-h-80 overflow-y-auto p-1">
                    {categorized.globalVoices.map(renderVoiceItem)}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
