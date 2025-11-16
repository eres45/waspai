"use client";

import { ToolUIPart } from "ai";
import equal from "lib/equal";
import { ImagesIcon, Download } from "lucide-react";
import { memo, useMemo, useCallback, useState, useRef } from "react";
import { TextShimmer } from "ui/text-shimmer";
import { toast } from "sonner";

interface VideoGenToolInvocationProps {
  part: ToolUIPart;
}

interface VideoGenResult {
  video: {
    url: string;
    mimeType?: string;
  };
  guide?: string;
}

function PureVideoGenToolInvocation({
  part,
}: VideoGenToolInvocationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const handleDownload = useCallback(async (videoUrl: string) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "generated-video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Video downloaded successfully");
    } catch (error) {
      toast.error("Failed to download video");
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "Loading...";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const isGenerating = useMemo(() => {
    return !part.state.startsWith("output");
  }, [part.state]);

  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as VideoGenResult;
  }, [part.state, part.output]);

  const video = useMemo(() => {
    return result?.video;
  }, [result]);

  const guide = useMemo(() => {
    return result?.guide;
  }, [result]);

  const hasError = useMemo(() => {
    return part.state === "output-error" || (part.state === "output-available" && !video?.url);
  }, [part.state, video]);

  if (hasError) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2 text-destructive">
          <ImagesIcon className="size-4" />
          <span className="text-sm font-medium">Video generation failed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        {isGenerating ? (
          <>
            <div className="p-1.5 text-primary bg-input/40 rounded">
              <ImagesIcon className="size-3.5 animate-spin" />
            </div>
            <TextShimmer>Generating video</TextShimmer>
          </>
        ) : (
          <>
            <div className="p-1.5 text-primary bg-input/40 rounded">
              <ImagesIcon className="size-3.5" />
            </div>
            <span className="font-medium text-sm">Video generated</span>
          </>
        )}
      </div>

      {video?.url && (
        <div className="flex flex-col gap-2 w-full">
          <div className="relative group w-full rounded-lg overflow-hidden border border-border bg-card">
            <video
              ref={videoRef}
              src={video.url}
              controls
              onLoadedMetadata={handleLoadedMetadata}
              className="w-full h-auto object-contain"
              controlsList="nodownload"
            />
            {/* Download button - top right corner */}
            <button
              onClick={() => handleDownload(video.url)}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
              title="Download video"
            >
              <Download className="size-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {videoDuration !== null ? `Duration: ${formatDuration(videoDuration)}` : "Loading video..."}
            </span>
            {guide && <span>{guide}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export const VideoGenToolInvocation = memo(
  PureVideoGenToolInvocation,
  (prev, next) => {
    if (prev.part.state !== next.part.state) return false;
    if (!equal(prev.part.output, next.part.output)) return false;
    return true;
  },
);

VideoGenToolInvocation.displayName = "VideoGenToolInvocation";
