"use client";

import { ToolUIPart } from "ai";
import equal from "lib/equal";
import { cn } from "lib/utils";
import { ImagesIcon, Download } from "lucide-react";
import { memo, useMemo, useCallback } from "react";
import { TextShimmer } from "ui/text-shimmer";
import LetterGlitch from "ui/letter-glitch";
import { toast } from "sonner";

interface ImageGeneratorToolInvocationProps {
  part: ToolUIPart;
}

interface ImageGenerationResult {
  images: {
    url: string;
    mimeType?: string;
  }[];
  mode?: "create" | "edit" | "composite";
  model: string;
}

function PureImageGeneratorToolInvocation({
  part,
}: ImageGeneratorToolInvocationProps) {
  const handleDownload = useCallback(
    async (imageUrl: string, index: number) => {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `generated-image-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Image downloaded successfully");
      } catch (_error) {
        toast.error("Failed to download image");
      }
    },
    [],
  );

  const isGenerating = useMemo(() => {
    return !part.state.startsWith("output");
  }, [part.state]);

  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as ImageGenerationResult;
  }, [part.state, part.output]);

  const images = useMemo(() => {
    return result?.images || [];
  }, [result]);

  const mode = useMemo(() => {
    return result?.mode || "create";
  }, [result]);

  const hasError = useMemo(() => {
    return (
      part.state === "output-error" ||
      (part.state === "output-available" && result?.images.length === 0)
    );
  }, [part.state, result]);

  // Get mode-specific text
  const getModeText = (mode: string) => {
    switch (mode) {
      case "edit":
        return "Editing image...";
      case "composite":
        return "Compositing images...";
      default:
        return "Generating image...";
    }
  };

  const getModeHeader = (mode: string) => {
    switch (mode) {
      case "edit":
        return "Image edited";
      case "composite":
        return "Images composited";
      default:
        return "Image generated";
    }
  };

  const getModelLabel = (model: string) => {
    const modelLabels: Record<string, string> = {
      "img-cv": "IMG-CV",
      "flux-max": "Flux-Max",
      "gpt-imager": "GPT-Imager",
      "imagen-3": "Imagen-3",
      "nano-banana": "Nano-Banana",
      sdxl: "Stable Diffusion XL",
      chalk: "Chalk Name Style",
      meme: "Meme Generator",
      google: "Gemini",
      openai: "OpenAI",
    };
    return modelLabels[model] || model;
  };

  // Simple loading state like web-search
  if (isGenerating) {
    return (
      <div className="flex flex-col gap-4">
        <TextShimmer>{getModeText(mode)}</TextShimmer>
        <div className="w-full h-96 overflow-hidden rounded-lg">
          <LetterGlitch />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Image generation may take up to 1 minute.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {!hasError && <ImagesIcon className="size-4" />}
        <span className="text-sm font-semibold">
          {hasError ? "Image generation failed" : getModeHeader(mode)}
        </span>
        {result?.model && (
          <span className="text-xs text-muted-foreground">
            {getModelLabel(result.model)}
          </span>
        )}
      </div>

      <div className="w-full flex flex-col gap-3 pb-2">
        {hasError ? (
          <div className="bg-card text-muted-foreground p-6 rounded-lg text-xs border border-border/20">
            {part.errorText ??
              (result?.images.length === 0
                ? "No images generated"
                : "Failed to generate image. Please try again.")}
          </div>
        ) : (
          <>
            <div
              className={cn(
                "grid gap-3",
                images.length === 1
                  ? "grid-cols-1 max-w-2xl"
                  : "grid-cols-1 md:grid-cols-2 max-w-3xl",
              )}
            >
              {images.map((image, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden border border-border hover:border-primary transition-all shadow-sm hover:shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    loading="lazy"
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-auto object-cover"
                  />
                  {/* Download button - top right corner */}
                  <button
                    onClick={() => handleDownload(image.url, index)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                    title="Download image"
                  >
                    <Download className="size-4" />
                  </button>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:scale-105 transition-transform pointer-events-auto"
                    >
                      Open
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const ImageGeneratorToolInvocation = memo(
  PureImageGeneratorToolInvocation,
  (prev, next) => {
    return equal(prev.part, next.part);
  },
);
