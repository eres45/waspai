"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Loader } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { Textarea } from "ui/textarea";

export interface AIMusicGenData {
  musicName: string;
  genre: string;
  mood: string;
  style: string;
  description: string;
}

interface AIMusicGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: AIMusicGenData) => Promise<void>;
}

const GENRES = [
  "pop",
  "rock",
  "hip-hop",
  "jazz",
  "classical",
  "electronic",
  "indie",
  "folk",
  "metal",
  "r&b",
  "country",
  "ambient",
];

const MOODS = [
  "happy",
  "sad",
  "energetic",
  "calm",
  "romantic",
  "aggressive",
  "melancholic",
  "uplifting",
  "dark",
  "playful",
];

const STYLES = [
  "modern",
  "vintage",
  "experimental",
  "minimalist",
  "orchestral",
  "acoustic",
  "electronic",
  "lo-fi",
  "cinematic",
  "indie",
];

export function AIMusicGenModal({
  isOpen,
  onClose,
  onGenerate,
}: AIMusicGenModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<AIMusicGenData>({
    musicName: "",
    genre: "pop",
    mood: "happy",
    style: "modern",
    description: "",
  });

  const handleGenerate = useCallback(async () => {
    if (!formData.musicName.trim()) {
      toast.error("Please enter a song name");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate(formData);
      onClose();
      setFormData({
        musicName: "",
        genre: "pop",
        mood: "happy",
        style: "modern",
        description: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate music");
    } finally {
      setIsGenerating(false);
    }
  }, [formData, onGenerate, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Song Lyrics with AI</DialogTitle>
          <DialogDescription>
            Provide details about the song you want to generate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="musicName">Song Name</Label>
            <Input
              id="musicName"
              placeholder="e.g., Summer Dreams"
              value={formData.musicName}
              onChange={(e) =>
                setFormData({ ...formData, musicName: e.target.value })
              }
              disabled={isGenerating}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select
                value={formData.genre}
                onValueChange={(value) =>
                  setFormData({ ...formData, genre: value })
                }
                disabled={isGenerating}
              >
                <SelectTrigger id="genre">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood">Mood</Label>
              <Select
                value={formData.mood}
                onValueChange={(value) =>
                  setFormData({ ...formData, mood: value })
                }
                disabled={isGenerating}
              >
                <SelectTrigger id="mood">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <Select
              value={formData.style}
              onValueChange={(value) =>
                setFormData({ ...formData, style: value })
              }
              disabled={isGenerating}
            >
              <SelectTrigger id="style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the song you want to generate. Include themes, lyrics ideas, and any specific elements you'd like..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="min-h-24 resize-none"
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              AI will generate a full 3-minute song based on your description
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                !formData.musicName.trim() ||
                !formData.description.trim()
              }
              className="gap-2"
            >
              {isGenerating && <Loader className="size-4 animate-spin" />}
              {isGenerating ? "Generating..." : "Generate Song"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
