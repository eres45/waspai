"use client";

import { X } from "lucide-react";
import { Button } from "ui/button";
import { cn } from "@/lib/utils";

interface FilePreviewProps {
  url: string;
  name: string;
  type: string;
  size: number;
  onRemove?: () => void;
  className?: string;
}

export function FilePreview({
  url,
  name,
  type,
  size,
  onRemove,
  className,
}: FilePreviewProps) {
  const isImage = type.startsWith("image/");
  const isVideo = type.startsWith("video/");
  const isAudio = type.startsWith("audio/");

  return (
    <div
      className={cn(
        "relative w-full max-w-sm bg-muted rounded-lg overflow-hidden border border-border",
        className,
      )}
    >
      {/* Remove Button */}
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="absolute top-2 right-2 z-10 size-8 bg-background/80 hover:bg-background"
        >
          <X className="size-4" />
        </Button>
      )}

      {/* Image Preview */}
      {isImage && (
        <img
          src={url}
          alt={name}
          className="w-full h-auto max-h-96 object-contain"
        />
      )}

      {/* Video Preview */}
      {isVideo && (
        <video
          src={url}
          className="w-full h-auto max-h-96 object-contain"
          controls
        />
      )}

      {/* Audio Preview */}
      {isAudio && (
        <div className="w-full p-4 flex flex-col items-center justify-center min-h-24">
          <div className="text-3xl mb-2">🎵</div>
          <audio src={url} controls className="w-full" />
          <p className="text-xs text-muted-foreground mt-2 truncate">{name}</p>
        </div>
      )}

      {/* File Preview (PDF, Doc, etc) */}
      {!isImage && !isVideo && !isAudio && (
        <div className="w-full p-4 flex flex-col items-center justify-center min-h-32">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-sm font-medium text-center truncate max-w-xs">
            {name}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {(size / 1024 / 1024).toFixed(2)} MB
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-xs text-blue-500 hover:underline"
          >
            Download
          </a>
        </div>
      )}
    </div>
  );
}
