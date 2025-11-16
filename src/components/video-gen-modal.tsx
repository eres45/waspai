"use client";

import { useCallback, useState } from "react";
import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
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

export function VideoGenModal() {
  const [videoGenState, appStoreMutate] = appStore(
    useShallow((state) => [state.videoGenState, state.mutate]),
  );

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClose = useCallback(() => {
    appStoreMutate({
      videoGenState: {
        isOpen: false,
        model: undefined,
      },
    });
    setPrompt("");
  }, [appStoreMutate]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt for video generation");
      return;
    }

    setIsGenerating(true);
    try {
      // Dispatch custom event to send message with video gen metadata
      const event = new CustomEvent("videoGenSubmit", {
        detail: {
          prompt,
          model: videoGenState?.model,
        },
      });
      window.dispatchEvent(event);

      toast.success("Video generation started!");
      handleClose();
    } catch (error) {
      toast.error("Failed to start video generation");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, videoGenState?.model, handleClose]);

  return (
    <Dialog open={videoGenState?.isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Video with {videoGenState?.model?.toUpperCase()}</DialogTitle>
          <DialogDescription>
            Describe the video you want to generate in detail
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Video Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="e.g., A cat playing with a ball in a sunny garden, cinematic quality..."
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
              {isGenerating ? "Generating..." : "Generate Video"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
