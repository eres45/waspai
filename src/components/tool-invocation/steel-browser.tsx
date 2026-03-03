import { ToolUIPart } from "ai";
import { ExternalLinkIcon, MonitorIcon, MousePointer2Icon } from "lucide-react";
import { memo, useMemo } from "react";
import { TextShimmer } from "ui/text-shimmer";
import { Button } from "ui/button";

export const SteelBrowserPreview = memo(function SteelBrowserPreview({
  part,
}: {
  part: ToolUIPart;
}) {
  const isRunning = useMemo(() => {
    return part.state.startsWith("input");
  }, [part.state]);

  const output = useMemo(() => {
    if (part.state.startsWith("output") && part.output) {
      return part.output as { sessionUrl?: string; message?: string };
    }
    return null;
  }, [part.state, part.output]);

  const sessionUrl = useMemo(() => {
    return output?.sessionUrl;
  }, [output]);

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
          <span>Steel Cloud Browser (Live)</span>
        </div>
      </div>

      <div className="relative group border rounded-2xl overflow-hidden shadow-2xl bg-black aspect-video ring-1 ring-border/50">
        <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 text-[10px] text-white/90 font-medium">
            Live preview (non-interactive)
          </div>
        </div>

        <iframe
          src={sessionUrl}
          className="w-full h-full border-0"
          title="Steel Browser Preview"
          allow="camera; microphone; clipboard-read; clipboard-write; display-capture"
        />
      </div>

      <div className="flex items-center gap-2 px-1">
        <Button
          size="sm"
          variant="outline"
          className="h-8 bg-background/50 hover:bg-accent backdrop-blur-sm border-border/50 rounded-lg text-xs gap-2 px-3 transition-all active:scale-95"
          onClick={() => window.open(sessionUrl, "_blank")}
        >
          <MousePointer2Icon className="size-3.5" />
          Take control
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 bg-muted/50 hover:bg-muted font-medium rounded-lg text-xs gap-2 px-3 transition-all active:scale-95"
          onClick={() => window.open(sessionUrl, "_blank")}
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
