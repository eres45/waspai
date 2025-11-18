"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useObjectState } from "@/hooks/use-object-state";
import { BACKGROUND_COLORS } from "lib/const";
import { Loader, Upload, Sparkles } from "lucide-react";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Textarea } from "ui/textarea";
import { ScrollArea } from "ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { BackgroundPaths } from "ui/background-paths";

interface Character {
  id?: string;
  name: string;
  description: string;
  personality: string;
  voiceType?: string;
  icon?: {
    type: string;
    value: string;
    style?: {
      backgroundColor: string;
    };
  };
  source?: string;
  origin?: string;
}

const defaultConfig = (): Character => {
  return {
    name: "",
    description: "",
    personality: "",
    voiceType: "default",
    icon: {
      type: "emoji",
      value: "🎭",
      style: {
        backgroundColor: BACKGROUND_COLORS[0],
      },
    },
  };
};

interface EditCharacterProps {
  initialCharacter?: Character;
  _userId?: string;
  characterId?: string;
}

export default function EditCharacter({
  initialCharacter,
  _userId,
  characterId,
}: EditCharacterProps) {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

  // Initialize character state with initial data or defaults
  const [character, setCharacter] = useObjectState(
    initialCharacter || defaultConfig(),
  );

  const GENERATION_TIPS = [
    "💡 Analyzing character traits and personality...",
    "🎭 Building character background and history...",
    "💬 Crafting unique speaking style...",
    "🎨 Generating character description...",
    "✨ Finalizing character profile...",
  ];

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `File size must be less than 1MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        );
        return;
      }

      // Check file type
      if (
        !["image/png", "image/gif", "image/jpeg", "image/webp"].includes(
          file.type,
        )
      ) {
        toast.error("Only PNG, GIF, JPEG, and WebP images are supported");
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setCharacter({
          icon: {
            type: "image",
            value: base64,
            style: {
              backgroundColor:
                character.icon?.style?.backgroundColor || BACKGROUND_COLORS[0],
            },
          },
        });
        toast.success("Image uploaded successfully");
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
      };
      reader.readAsDataURL(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [character.icon?.style?.backgroundColor],
  );

  const handleGenerateClick = useCallback(() => {
    if (!character.name.trim()) {
      toast.error("Character name is required");
      return;
    }
    setShowPrivacyDialog(true);
  }, [character.name]);

  const handlePrivacySelect = useCallback(
    async (_privacy: "public" | "private") => {
      setShowPrivacyDialog(false);
      setShowLoadingDialog(true);
      setIsGenerating(true);

      try {
        // Create prompt for Pollinations API
        const prompt = `Generate a detailed character profile for "${character.name}".
Origin/Source: ${character.origin}

Please provide:
1. A detailed description of the character (2-3 sentences)
2. Personality traits and characteristics (5-7 key traits)
3. Speaking style and mannerisms
4. Background and history
5. Key characteristics and quirks

Format the response as a structured character profile.`;

        // Call Pollinations API
        const response = await fetch("https://text.pollinations.ai/openai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            model: "openai",
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate character");
        }

        const data = await response.json();
        const generatedContent = data.choices?.[0]?.message?.content || "";

        // Parse the generated content
        const lines = generatedContent
          .split("\n")
          .filter((line: string) => line.trim());

        // Extract description and personality from generated content
        const description = lines.slice(0, 3).join(" ").substring(0, 200);
        const personality = lines.slice(3).join(" ").substring(0, 500);

        setCharacter({
          description: description || "Character generated successfully",
          personality: personality || "Generated personality traits",
        });

        setShowLoadingDialog(false);
        toast.success("Your character is ready!");
      } catch (error) {
        setShowLoadingDialog(false);
        toast.error("Failed to generate character");
        console.error(error);
      } finally {
        setIsGenerating(false);
      }
    },
    [character.name, character.origin],
  );

  const handleSaveClick = useCallback(() => {
    if (!character.name.trim()) {
      toast.error("Character name is required");
      return;
    }

    if (mode === "manual" && !character.description.trim()) {
      toast.error("Character description is required");
      return;
    }

    if (mode === "manual" && !character.personality.trim()) {
      toast.error("Character personality is required");
      return;
    }

    // For manual mode, show privacy dialog
    if (mode === "manual") {
      setShowPrivacyDialog(true);
    } else {
      // For auto mode, save directly
      performSave("private");
    }
  }, [character, mode]);

  const performSave = useCallback(
    async (privacy: "public" | "private") => {
      setIsSaving(true);
      try {
        const payload = {
          name: character.name,
          description: character.description,
          personality: character.personality,
          icon: character.icon,
          privacy,
        };

        const response = await fetch("/api/character", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to save character");
        }

        toast.success("Character saved successfully");
        router.push("/characters");
      } catch (error) {
        toast.error("Failed to save character");
        console.error(error);
      } finally {
        setIsSaving(false);
        setShowPrivacyDialog(false);
      }
    },
    [character, router],
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {characterId === "new" ? "Create Character" : "Edit Character"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define your character&apos;s personality and traits
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveClick}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving && <Loader className="size-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Character"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-2xl">
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "manual" | "auto")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="auto">Auto Generate</TabsTrigger>
            </TabsList>

            {/* Manual Tab */}
            <TabsContent value="manual" className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Character Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Wise Mentor, Funny Friend"
                  value={character.name}
                  onChange={(e) => setCharacter({ name: e.target.value })}
                  className="text-base"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your character"
                  value={character.description}
                  onChange={(e) =>
                    setCharacter({ description: e.target.value })
                  }
                  className="min-h-24 resize-none"
                />
              </div>

              {/* Personality */}
              <div className="space-y-2">
                <Label htmlFor="personality">Personality & Traits</Label>
                <Textarea
                  id="personality"
                  placeholder="Describe the character's personality, speaking style, and unique traits..."
                  value={character.personality}
                  onChange={(e) =>
                    setCharacter({ personality: e.target.value })
                  }
                  className="min-h-32 resize-none"
                  ref={textareaRef}
                />
                <p className="text-xs text-muted-foreground">
                  Be detailed about how this character should behave and
                  communicate
                </p>
              </div>

              {/* Voice Type */}
              <div className="space-y-2">
                <Label htmlFor="voiceType">Voice Type</Label>
                <select
                  id="voiceType"
                  value={character.voiceType || "default"}
                  onChange={(e) => setCharacter({ voiceType: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="default">Default</option>
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                </select>
              </div>

              {/* Icon Upload */}
              <div className="space-y-2">
                <Label>Character Icon</Label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl flex-shrink-0"
                    style={{
                      backgroundColor: character.icon?.style?.backgroundColor,
                    }}
                  >
                    {character.icon?.type === "image" ? (
                      <img
                        src={character.icon.value}
                        alt="Character"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      character.icon?.value
                    )}
                  </div>
                  <div className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full gap-2"
                    >
                      <Upload className="size-4" />
                      Upload Image
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/gif,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, GIF, JPEG, WebP • Max 1MB
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Auto Generate Tab */}
            <TabsContent value="auto" className="space-y-6">
              {/* Character Name */}
              <div className="space-y-2">
                <Label htmlFor="auto-name">Character Name</Label>
                <Input
                  id="auto-name"
                  placeholder="e.g., Sherlock Holmes, Elsa, Tony Stark"
                  value={character.name}
                  onChange={(e) => setCharacter({ name: e.target.value })}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the character name you want to generate
                </p>
              </div>

              {/* Origin/Source */}
              <div className="space-y-2">
                <Label htmlFor="origin">Character Origin & Source</Label>
                <Textarea
                  id="origin"
                  placeholder="e.g., From the movie 'Frozen' (2013), Disney animated film. Elsa is the Snow Queen with ice powers..."
                  value={character.origin}
                  onChange={(e) => setCharacter({ origin: e.target.value })}
                  className="min-h-32 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Describe where the character is from (movie, book, game, real
                  person, etc.) and provide context
                </p>
              </div>

              {/* Icon Upload */}
              <div className="space-y-2">
                <Label>Character Icon</Label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl flex-shrink-0"
                    style={{
                      backgroundColor: character.icon?.style?.backgroundColor,
                    }}
                  >
                    {character.icon?.type === "image" ? (
                      <img
                        src={character.icon.value}
                        alt="Character"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      character.icon?.value
                    )}
                  </div>
                  <div className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full gap-2"
                    >
                      <Upload className="size-4" />
                      Upload Image
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/gif,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, GIF, JPEG, WebP • Max 1MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateClick}
                disabled={isGenerating || !character.name.trim()}
                className="w-full gap-2"
              >
                {isGenerating && <Loader className="size-4 animate-spin" />}
                {isGenerating ? "Generating..." : "Generate Character"}
              </Button>

              {/* Generated Preview */}
              {character.description && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border/40">
                  <div>
                    <h3 className="font-semibold mb-2">
                      Generated Description
                    </h3>
                    <p className="text-sm text-foreground/80">
                      {character.description}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">
                      Generated Personality
                    </h3>
                    <p className="text-sm text-foreground/80">
                      {character.personality}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Privacy Selection Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Character Privacy</DialogTitle>
            <DialogDescription>
              Would you like this character to be public or private?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => handlePrivacySelect("public")}
              className="h-24 flex flex-col items-center justify-center gap-2"
            >
              <span className="text-2xl">🌍</span>
              <span className="text-sm font-medium">Public</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePrivacySelect("private")}
              className="h-24 flex flex-col items-center justify-center gap-2"
            >
              <span className="text-2xl">🔒</span>
              <span className="text-sm font-medium">Private</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loading Dialog with Background Animation */}
      <Dialog open={showLoadingDialog} onOpenChange={setShowLoadingDialog}>
        <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none">
          <div className="relative bg-background border border-border/40 rounded-lg overflow-hidden">
            {/* Background Animation */}
            <div className="absolute inset-0 w-full h-full opacity-30">
              <BackgroundPaths />
            </div>

            {/* Content */}
            <div className="relative z-10 p-8 flex flex-col items-center justify-center min-h-80 gap-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <Loader className="w-full h-full animate-spin text-primary" />
                  <Sparkles className="absolute inset-0 w-full h-full text-yellow-400 animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-center">
                  Creating Your Character
                </h2>
              </div>

              {/* Tips */}
              <div className="w-full space-y-3">
                {GENERATION_TIPS.map((tip, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-sm text-foreground/80 animate-fade-in"
                    style={{
                      animationDelay: `${index * 0.3}s`,
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                This may take a moment...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
