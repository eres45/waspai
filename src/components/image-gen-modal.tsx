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
import { Textarea } from "ui/textarea";
import { Label } from "ui/label";
import { Loader } from "lucide-react";

export function ImageGenModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Watch for model changes and open modal
  const handleModelSelect = useCallback((model: string) => {
    setSelectedModel(model);
    setIsOpen(true);
    setPrompt("");
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSelectedModel(null);
    setPrompt("");
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt for image generation");
      return;
    }

    if (!selectedModel) {
      toast.error("No model selected");
      return;
    }

    setIsGenerating(true);
    try {
      // Dispatch custom event to send message with image gen metadata
      const event = new CustomEvent("imageGenSubmit", {
        detail: {
          prompt,
          model: selectedModel,
        },
      });
      window.dispatchEvent(event);

      toast.success("Image generation started!");
      handleClose();
    } catch (error) {
      toast.error("Failed to start image generation");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedModel, handleClose]);

  // Expose model selection handler globally
  if (typeof window !== "undefined") {
    (window as any).selectImageGenModel = handleModelSelect;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Generate Image with {selectedModel?.toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Describe the image you want to generate in detail
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Image Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="e.g., A beautiful sunset over mountains, oil painting style, vibrant colors..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-24 resize-none"
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Be as detailed as possible for better results
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="gap-2"
            >
              {isGenerating && <Loader className="size-4 animate-spin" />}
              {isGenerating ? "Generating..." : "Generate Image"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
