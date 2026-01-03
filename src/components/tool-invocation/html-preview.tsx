import { useCopy } from "@/hooks/use-copy";
import { ToolUIPart } from "ai";
import { CheckIcon, Code2Icon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { memo, useMemo, useRef, useState } from "react";
import { TextShimmer } from "ui/text-shimmer";

export const HtmlPreview = memo(function HtmlPreview({
  part,
}: {
  part: ToolUIPart;
}) {
  const { copy, copied } = useCopy();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const isRunning = useMemo(() => {
    return part.state.startsWith("input");
  }, [part.state]);

  const output = useMemo(() => {
    if (part.state.startsWith("output")) {
      return part.output as { code: string; fileType?: string };
    }
    return null;
  }, [part.state, part.output]);

  const fileType = useMemo(() => {
    return output?.fileType?.toUpperCase() || "HTML";
  }, [output]);

  const header = useMemo(() => {
    if (isRunning) {
      return (
        <>
          <div className="size-3 bg-blue-500 rounded-full animate-pulse" />
          <TextShimmer className="text-xs">Generating Preview...</TextShimmer>
        </>
      );
    }
    return (
      <>
        <div className="text-[7px] bg-input rounded-xs w-4 h-4 p-0.5 flex items-center justify-center font-bold">
          {fileType === "HTML" ? "H" : fileType === "CSS" ? "C" : "JS"}
        </div>
        <span className="text-xs font-medium">{fileType} Preview</span>
      </>
    );
  }, [isRunning, fileType]);

  const openInNewTab = () => {
    if (!output?.code) return;
    const blob = new Blob([output.code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col">
      <div className="px-6 py-3">
        <div className="border overflow-hidden relative rounded-lg shadow fade-in animate-in duration-500">
          {/* Header */}
          <div className="py-2.5 bg-border px-4 flex items-center gap-1.5 z-10 min-h-[37px]">
            {header}
            <div className="flex-1" />

            {output && (
              <>
                <div
                  className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1 transition-all rounded-sm cursor-pointer hover:bg-input hover:text-foreground font-semibold"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <Code2Icon className="size-2" />
                  {isExpanded ? "Hide" : "Show"} Code
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1 transition-all rounded-sm cursor-pointer hover:bg-input hover:text-foreground font-semibold"
                  onClick={openInNewTab}
                >
                  <ExternalLinkIcon className="size-2" />
                  Open
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1 transition-all rounded-sm cursor-pointer hover:bg-input hover:text-foreground font-semibold"
                  onClick={() => copy(output.code)}
                >
                  {copied ? (
                    <CheckIcon className="size-2" />
                  ) : (
                    <CopyIcon className="size-2" />
                  )}
                  Copy
                </div>
              </>
            )}
          </div>

          {/* Preview */}
          {output && (
            <div className="bg-background">
              {/* Code View (Collapsible) */}
              {isExpanded && (
                <div className="border-b">
                  <pre className="p-4 text-[10px] overflow-x-auto max-h-[300px] overflow-y-auto bg-muted">
                    <code>{output.code}</code>
                  </pre>
                </div>
              )}

              {/* Iframe Preview */}
              <div className="p-4">
                <div className="border rounded-lg overflow-hidden bg-white">
                  <iframe
                    ref={iframeRef}
                    srcDoc={output.code}
                    sandbox="allow-scripts allow-forms allow-modals allow-same-origin allow-pointer-lock"
                    className="w-full min-h-[400px] border-0"
                    title="HTML Preview"
                    tabIndex={0}
                    style={{ pointerEvents: "auto" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isRunning && (
            <div className="p-8 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Generating preview...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
