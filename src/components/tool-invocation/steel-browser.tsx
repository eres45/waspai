import { ToolUIPart } from "ai";
import {
  ExternalLinkIcon,
  MonitorIcon,
  MousePointer2Icon,
  LockIcon,
  UnlockIcon,
} from "lucide-react";
import { memo, useMemo, useState, useCallback } from "react";
import { TextShimmer } from "ui/text-shimmer";
import { Button } from "ui/button";
import { cn } from "@/lib/utils";

export const SteelBrowserPreview = memo(function SteelBrowserPreview({
  part,
}: {
  part: ToolUIPart;
}) {
  const [isInteractive, setIsInteractive] = useState(false);

  const isRunning = useMemo(() => {
    return part.state.startsWith("input");
  }, [part.state]);

  const output = useMemo(() => {
    if (part.state.startsWith("output") && part.output) {
      return part.output as {
        sessionUrl?: string;
        message?: string;
        sessionId?: string;
      };
    }
    return null;
  }, [part.state, part.output]);

  const sessionUrl = useMemo(() => {
    if (!output?.sessionUrl) return null;
    const url = new URL(output.sessionUrl);
    // Force interactive based on state
    url.searchParams.set("interactive", isInteractive ? "true" : "false");
    return url.toString();
  }, [output, isInteractive]);

  const handleToggleControl = useCallback(() => {
    setIsInteractive((prev) => !prev);
  }, []);

  if (isRunning) {
    return (
      <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg border border-dashed animate-pulse">
        <MonitorIcon className="size-4 text-blue-500" />
        <TextShimmer className="text-sm">
          Spinning up cloud browser...
        </TextShimmer>
      </div>
    );
  }

  if (!sessionUrl) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 my-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
          <MonitorIcon className="size-3.5 text-blue-500" />
          <span>
            Steel Cloud Browser ({isInteractive ? "User Control" : "AI Control"}
            )
          </span>
        </div>
      </div>

      <div className="relative group border rounded-2xl overflow-hidden shadow-2xl bg-black aspect-video ring-1 ring-border/50">
        <div
          className={cn(
            "absolute top-3 left-3 z-20 transition-opacity duration-300",
            isInteractive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          <div
            className={cn(
              "px-2 py-1 backdrop-blur-md rounded-md border text-[10px] font-medium flex items-center gap-1.5",
              isInteractive
                ? "bg-green-500/20 border-green-500/30 text-green-200"
                : "bg-black/60 border-white/10 text-white/90",
            )}
          >
            {isInteractive ? (
              <UnlockIcon className="size-2.5" />
            ) : (
              <LockIcon className="size-2.5" />
            )}
            {isInteractive ? "User Control Active" : "Live preview (AI Only)"}
          </div>
        </div>

        <div className="relative w-full h-full">
          <iframe
            src={sessionUrl}
            className={cn(
              "w-full h-full border-0 transition-opacity",
              !isInteractive && "opacity-90 grayscale-[0.2]",
            )}
            title="Steel Browser Preview"
            allow="camera; microphone; clipboard-read; clipboard-write; display-capture"
          />
          {!isInteractive && (
            <div
              className="absolute inset-0 z-10 cursor-not-allowed"
              title="AI is controlling this browser. Click 'Take control' to interact."
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 px-1">
        <Button
          size="sm"
          variant={isInteractive ? "default" : "outline"}
          className={cn(
            "h-8 rounded-lg text-xs gap-2 px-3 transition-all active:scale-95",
            isInteractive
              ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent"
              : "bg-background/50 hover:bg-accent backdrop-blur-sm border-border/50",
          )}
          onClick={handleToggleControl}
        >
          <MousePointer2Icon className="size-3.5" />
          {isInteractive ? "Release control" : "Take control"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 bg-muted/50 hover:bg-muted font-medium rounded-lg text-xs gap-2 px-3 transition-all active:scale-95"
          onClick={() => window.open(output?.sessionUrl, "_blank")}
        >
          <ExternalLinkIcon className="size-3.5" />
          Open view
        </Button>
      </div>

      {output?.message && (
        <p className="text-[10px] text-muted-foreground/60 px-1 italic">
          {output.message}
        </p>
      )}
    </div>
  );
});
