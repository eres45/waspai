"use client";

import { ToolUIPart } from "ai";
import equal from "lib/equal";
import { Download } from "lucide-react";
import { memo, useMemo, useCallback } from "react";
import { TextShimmer } from "ui/text-shimmer";
import { toast } from "sonner";
import { Button } from "ui/button";

interface ImageEnhancerToolInvocationProps {
  part: ToolUIPart;
}

interface ImageEnhanceResult {
  originalImage: {
    url: string;
    mimeType?: string;
  };
  enhancedImage: {
    url: string;
    mimeType?: string;
  };
  guide?: string;
}

function PureImageEnhancerToolInvocation({
  part,
}: ImageEnhancerToolInvocationProps) {
  const handleDownload = useCallback(async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded successfully");
    } catch (error) {
      toast.error("Failed to download image");
    }
  }, []);

  const isEnhancing = useMemo(() => {
    return !part.state.startsWith("output");
  }, [part.state]);

  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as ImageEnhanceResult;
  }, [part.state, part.output]);

  if (isEnhancing) {
    return (
      <div className="flex items-center gap-2 py-4">
        <TextShimmer className="text-sm text-muted-foreground">
          Enhancing image...
        </TextShimmer>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Comparison View */}
      <div className="grid grid-cols-2 gap-4">
        {/* Original Image */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Original</div>
          <div className="relative w-full bg-muted rounded-lg overflow-hidden border border-border/40">
            <img
              src={result.originalImage.url}
              alt="Original image"
              className="w-full h-auto object-cover"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2"
            onClick={() => handleDownload(result.originalImage.url, "original-image.png")}
          >
            <Download className="size-4" />
            Download Original
          </Button>
        </div>

        {/* Enhanced Image */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Enhanced</div>
          <div className="relative w-full bg-muted rounded-lg overflow-hidden border border-border/40">
            <img
              src={result.enhancedImage.url}
              alt="Enhanced image"
              className="w-full h-auto object-cover"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2"
            onClick={() => handleDownload(result.enhancedImage.url, "enhanced-image.png")}
          >
            <Download className="size-4" />
            Download Enhanced
          </Button>
        </div>
      </div>

      {/* Guide Text */}
      {result.guide && (
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/40">
          {result.guide}
        </div>
      )}
    </div>
  );
}

export const ImageEnhancerToolInvocation = memo(
  PureImageEnhancerToolInvocation,
  (prev, next) => {
    return (
      equal(prev.part.state, next.part.state) &&
      equal(prev.part.output, next.part.output)
    );
  },
);
