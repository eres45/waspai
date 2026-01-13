import { ToolUIPart } from "ai";
import { ExternalLinkIcon, PlayCircleIcon } from "lucide-react";
import { memo, useMemo } from "react";
import { TextShimmer } from "ui/text-shimmer";

export const VideoPlayer = memo(function VideoPlayer({
  part,
}: {
  part: ToolUIPart;
}) {
  const isRunning = useMemo(() => {
    return part.state.startsWith("input");
  }, [part.state]);

  const output = useMemo(() => {
    if (part.state.startsWith("output") && part.output) {
      return part.output as {
        success: boolean;
        openTubeUrl: string;
        mode?: string;
        videoId?: string;
        searchQuery?: string;
        transcriptSummary?: string;
      };
    }
    return null;
  }, [part.state, part.output]);

  return (
    <div className="flex flex-col">
      <div className="px-6 py-3">
        <div className="border overflow-hidden relative rounded-xl shadow-lg fade-in animate-in duration-500 bg-card">
          {/* Header */}
          <div className="py-2.5 bg-muted px-4 flex items-center gap-1.5 z-10 min-h-[37px]">
            <PlayCircleIcon className="size-4 text-primary" />
            <span className="text-xs font-semibold">
              OpenTube Player (Remote Control)
            </span>
            <div className="flex-1" />
            {output?.openTubeUrl && (
              <a
                href={output.openTubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1 transition-all rounded-sm cursor-pointer hover:bg-input hover:text-foreground font-semibold"
              >
                <ExternalLinkIcon className="size-2" />
                Open Original
              </a>
            )}
          </div>

          {/* Player Area */}
          <div className="p-4">
            <div className="aspect-video w-full relative bg-black rounded-lg overflow-hidden border shadow-inner">
              {output?.openTubeUrl ? (
                <iframe
                  id="opentube-frame"
                  src={output.openTubeUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="OpenTube Video Player"
                  onLoad={(e) => {
                    const iframe = e.currentTarget;
                    // Wait a brief moment for the app to initialize listeners
                    setTimeout(() => {
                      // Send search command if we have a query but no specific video ID yet
                      // OR if we just want to ensure it plays
                      if (output.videoId) {
                        // Assuming OpenTube accepts a 'play' or 'search' command
                        // We'll try sending the ID
                        iframe.contentWindow?.postMessage(
                          { type: "OPEN_VIDEO", videoId: output.videoId },
                          "*",
                        );
                      } else if (output.searchQuery) {
                        iframe.contentWindow?.postMessage(
                          { type: "SEARCH", query: output.searchQuery },
                          "*",
                        );
                      }
                    }, 2000);
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <TextShimmer className="text-sm font-medium">
                    Initializing Player...
                  </TextShimmer>
                </div>
              )}
            </div>
          </div>

          {/* Transcript Summary */}
          {output?.transcriptSummary && (
            <div className="px-4 pb-3">
              <div className="bg-muted/50 rounded-lg p-3 border">
                <h4 className="text-[10px] font-semibold text-muted-foreground mb-1.5">
                  AUTO-TRANSCRIPT SUMMARY
                </h4>
                <p className="text-xs text-foreground leading-relaxed">
                  {output.transcriptSummary}...
                </p>
              </div>
            </div>
          )}

          {/* Status Message */}
          {isRunning && (
            <div className="px-4 pb-3 flex items-center gap-2">
              <TextShimmer className="text-[10px] text-muted-foreground">
                Preparing secure stream via OpenTube Proxy...
              </TextShimmer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
