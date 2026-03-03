import { ToolUIPart } from "ai";
import { ExternalLinkIcon, MonitorIcon } from "lucide-react";
import { memo, useMemo } from "react";
import { TextShimmer } from "ui/text-shimmer";

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
    <div className="flex flex-col gap-2 my-2">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <MonitorIcon className="size-3 text-blue-500" />
          <span>Steel Cloud Browser (Live)</span>
        </div>
        <a
          href={sessionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-blue-500 hover:underline"
        >
          <ExternalLinkIcon className="size-2.5" />
          Open in New Tab
        </a>
      </div>
      <div className="border rounded-xl overflow-hidden shadow-sm bg-black aspect-video mr-12">
        <iframe
          src={sessionUrl}
          className="w-full h-full border-0"
          title="Steel Browser Preview"
          allow="camera; microphone; clipboard-read; clipboard-write; display-capture"
        />
      </div>
      {output?.message && (
        <p className="text-[10px] text-muted-foreground px-2 italic">
          {output.message}
        </p>
      )}
    </div>
  );
});
