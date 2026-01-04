"use client";

import { ToolUIPart } from "ai";
import equal from "lib/equal";
import { ImagesIcon, Download } from "lucide-react";
import { memo, useMemo, useCallback } from "react";
import { TextShimmer } from "ui/text-shimmer";
import Image from "next/image";
import { toast } from "sonner";

interface ImageEditorToolInvocationProps {
  part: ToolUIPart;
}

interface ImageEditResult {
  image: {
    url: string;
    mimeType?: string;
  };
  guide?: string;
}

function PureImageEditorToolInvocation({
  part,
}: ImageEditorToolInvocationProps) {
  const handleDownload = useCallback(async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "edited-image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded successfully");
    } catch (_error) {
      toast.error("Failed to download image");
    }
  }, []);

  const isEditing = useMemo(() => {
    return !part.state.startsWith("output");
  }, [part.state]);

  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as ImageEditResult;
  }, [part.state, part.output]);

  const image = useMemo(() => {
    return result?.image;
  }, [result]);

  const guide = useMemo(() => {
    return result?.guide;
  }, [result]);

  const hasError = useMemo(() => {
    return (
      part.state === "output-error" ||
      (part.state === "output-available" && !image?.url)
    );
  }, [part.state, image]);

  if (hasError) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2 text-destructive">
          <ImagesIcon className="size-4" />
          <span className="text-sm font-medium">Image editing failed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <div className="p-1.5 text-primary bg-input/40 rounded">
              <ImagesIcon className="size-3.5 animate-spin" />
            </div>
            <TextShimmer>Editing image</TextShimmer>
          </>
        ) : (
          <>
            <div className="p-1.5 text-primary bg-input/40 rounded">
              <ImagesIcon className="size-3.5" />
            </div>
            <span className="font-medium text-sm">Image edited</span>
          </>
        )}
      </div>

      {image?.url && (
        <div className="flex flex-col gap-2 w-full">
          <div className="relative group w-full rounded-lg overflow-hidden border border-border bg-card">
            <Image
              src={image.url}
              alt="Edited image"
              className="object-contain"
              fill
              unoptimized
            />
            {/* Download button - top right corner */}
            <button
              onClick={() => handleDownload(image.url)}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
              title="Download image"
            >
              <Download className="size-4" />
            </button>
          </div>
          {guide && <p className="text-xs text-muted-foreground">{guide}</p>}
        </div>
      )}
    </div>
  );
}

export const ImageEditorToolInvocation = memo(
  PureImageEditorToolInvocation,
  (prev, next) => {
    if (prev.part.state !== next.part.state) return false;
    if (!equal(prev.part.output, next.part.output)) return false;
    return true;
  },
);

ImageEditorToolInvocation.displayName = "ImageEditorToolInvocation";
