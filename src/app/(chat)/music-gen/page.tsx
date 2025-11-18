"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Button } from "ui/button";
import { Textarea } from "ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Music, Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "lib/utils";
import MusicGenLoader from "@/components/music-gen-loader";
import { BackgroundPaths } from "@/components/ui/background-paths";
import dynamic from "next/dynamic";

const AIMusicGenModal = dynamic(
  () =>
    import("@/components/ai-music-gen-modal").then(
      (mod) => mod.AIMusicGenModal,
    ),
  { ssr: false },
);

interface GeneratedMusic {
  id: string;
  lyrics: string;
  tags: string;
  url: string;
  generatedAt: Date;
}

const MUSIC_TAGS = [
  "epic",
  "orchestra",
  "cinematic",
  "sad",
  "piano",
  "hop",
  "pop",
  "electronic",
  "ambient",
  "jazz",
  "rock",
  "classical",
  "indie",
  "folk",
  "metal",
];

export default function MusicGenPage() {
  const [lyrics, setLyrics] = useState("");
  const [tags, setTags] = useState("pop");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState<GeneratedMusic[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<GeneratedMusic | null>(
    null,
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [isAIMusicModalOpen, setIsAIMusicModalOpen] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Load music generation history from database
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const response = await fetch("/api/music-gen/history");
        if (response.ok) {
          const data = await response.json();
          console.log("Loaded music history:", data);
          const musicList = data.map((item: any) => ({
            id: item.id,
            lyrics: item.lyrics,
            tags: item.tags,
            url: item.permanentUrl || item.tempUrl,
            generatedAt: new Date(item.createdAt),
          }));
          setGeneratedMusic(musicList);
        }
      } catch (error) {
        console.error("Error loading music history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, []);

  // Highlight lyrics with audio playback (no auto-scroll)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedMusic) return;

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      const totalDuration = audio.duration;

      if (totalDuration > 0 && !isNaN(totalDuration)) {
        const lyricsLines = selectedMusic.lyrics
          .split("\n")
          .filter((line) => line.trim());

        // Calculate which line should be highlighted based on time
        // Distribute lines evenly across the song duration
        const timePercentage = currentTime / totalDuration;
        const lineIndex = Math.floor(timePercentage * lyricsLines.length);
        const newIndex = Math.min(
          Math.max(lineIndex, 0),
          lyricsLines.length - 1,
        );

        setCurrentLyricIndex(newIndex);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [selectedMusic]);

  const handleGenerate = useCallback(async () => {
    if (!lyrics.trim()) {
      toast.error("Please enter song lyrics");
      return;
    }

    setIsGenerating(true);
    try {
      console.log("Starting music generation...");
      const response = await fetch("/api/music-gen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lyrics, tags }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate music");
      }

      const data = await response.json();
      console.log("Music generated:", data);

      const newMusic: GeneratedMusic = {
        id: data.id || Date.now().toString(),
        lyrics,
        tags,
        url: data.url,
        generatedAt: new Date(),
      };

      // Add to top of list and select it
      setGeneratedMusic((prev) => [newMusic, ...prev]);
      setSelectedMusic(newMusic);
      toast.success("Music generated successfully!");
      setLyrics("");
      setIsGenerating(false);

      // Reload history to sync with database
      try {
        const historyResponse = await fetch("/api/music-gen/history");
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          const musicList = historyData.map((item: any) => ({
            id: item.id,
            lyrics: item.lyrics,
            tags: item.tags,
            url: item.permanentUrl || item.tempUrl,
            generatedAt: new Date(item.createdAt),
          }));
          setGeneratedMusic(musicList);
        }
      } catch (error) {
        console.warn("Error reloading history:", error);
      }
    } catch (error) {
      console.error("Error generating music:", error);
      toast.error("Failed to generate music. Please try again.");
      setIsGenerating(false);
    }
  }, [lyrics, tags]);

  const handleDownload = useCallback((music: GeneratedMusic) => {
    const link = document.createElement("a");
    link.href = music.url;
    link.download = `music-${music.id}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started!");
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border/40 px-6 py-4">
        <div className="flex items-center gap-3">
          <Music className="size-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Music Generation</h1>
            <p className="text-sm text-muted-foreground">
              Generate unique music from text descriptions
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex gap-4 p-6">
        {/* Left Panel - Generator */}
        <div className="w-1/3 flex flex-col gap-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create Music</CardTitle>
              <CardDescription>
                Describe the music you want to generate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Song Lyrics</label>
                <Textarea
                  placeholder="Enter your song lyrics here...&#10;&#10;Example:&#10;DarkAI, future in my mind&#10;Breaking all the chains, leaving fear behind&#10;AI in the sky, shining like a star&#10;Guiding every dream, taking us so far"
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  className="min-h-32 resize-none"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Music Style Tags</label>
                <div className="flex flex-wrap gap-2">
                  {MUSIC_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setTags(tag)}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm transition-colors",
                        tags === tag
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                      )}
                      disabled={isGenerating}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !lyrics.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="size-4 mr-2 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Music className="size-4 mr-2" />
                    Generate Music
                  </>
                )}
              </Button>

              <Button
                onClick={() => setIsAIMusicModalOpen(true)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Sparkles className="size-4 mr-2" />
                Generate with AI
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">Generation History</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-2">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : generatedMusic.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No music generated yet
                </p>
              ) : (
                generatedMusic.map((music) => (
                  <button
                    key={music.id}
                    onClick={() => setSelectedMusic(music)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-colors",
                      selectedMusic?.id === music.id
                        ? "bg-primary/10 border-primary"
                        : "border-border/40 hover:bg-accent",
                    )}
                  >
                    <p className="text-sm font-medium truncate">
                      {music.lyrics.split("\n")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {music.tags} • {music.generatedAt.toLocaleTimeString()}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Player */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {isGenerating ? (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center space-y-4">
                <MusicGenLoader />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">This may take up to 1-2 minutes</p>
                  <p className="text-xs mt-1">Creating high-quality music...</p>
                </div>
              </CardContent>
            </Card>
          ) : selectedMusic ? (
            <>
              <Card className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-background via-background to-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Now Playing</CardTitle>
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium capitalize mt-2 w-fit">
                    {selectedMusic.tags}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden pb-4">
                  {/* Scrolling Lyrics Display with Animated Background */}
                  <div className="flex-1 rounded-lg overflow-hidden relative">
                    <style>{`
                      @keyframes pulse-glow {
                        0%, 100% { opacity: 0.3; }
                        50% { opacity: 0.6; }
                      }
                      .lyrics-glow {
                        animation: pulse-glow 3s ease-in-out infinite;
                      }
                    `}</style>

                    {/* Background Animation */}
                    <div className="absolute inset-0 opacity-20">
                      <BackgroundPaths />
                    </div>

                    {/* Gradient overlays */}
                    <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

                    {/* Lyrics Container */}
                    <div className="relative z-20 h-full overflow-y-auto scroll-smooth p-6">
                      <div className="space-y-4 py-8">
                        {selectedMusic.lyrics.split("\n").map((line, idx) => {
                          const isCurrentLine = idx === currentLyricIndex;
                          return (
                            <p
                              key={idx}
                              id={`lyric-line-${idx}`}
                              className={cn(
                                "text-center leading-relaxed whitespace-pre-wrap break-words transition-all duration-300",
                                isCurrentLine
                                  ? "text-xl font-bold text-primary lyrics-glow scale-105"
                                  : "text-lg text-foreground/50 hover:text-foreground/70",
                              )}
                            >
                              {line || "\u00A0"}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Audio Player */}
                  <div className="space-y-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg p-4">
                    {/* Custom Player */}
                    <div className="space-y-3">
                      <audio
                        ref={audioRef}
                        key={selectedMusic.id}
                        src={selectedMusic.url}
                        controls
                        controlsList="nodownload"
                        className="w-full h-12 rounded-lg accent-primary"
                        style={{
                          accentColor: "hsl(var(--primary))",
                        }}
                      />

                      {/* Player Info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>🎵 High Quality Audio</span>
                        <span className="text-primary font-medium">
                          MP3 Format
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleDownload(selectedMusic)}
                        className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
                        size="sm"
                      >
                        <Download className="size-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Music className="size-16 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Generate or select music to preview
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* AI Music Generation Modal */}
      <AIMusicGenModal
        isOpen={isAIMusicModalOpen}
        onClose={() => setIsAIMusicModalOpen(false)}
        onGenerate={async (data) => {
          setLyrics(data.description);
          setTags(data.genre);
          // Trigger generation
          setTimeout(() => {
            handleGenerate();
          }, 100);
        }}
      />
    </div>
  );
}
