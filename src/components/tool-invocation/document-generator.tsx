"use client";

import { ToolUIPart } from "ai";
import { FileIcon, Download, GlobeIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "lib/utils";
import { useTranslations } from "next-intl";

interface DocumentGeneratorProps {
  part: ToolUIPart;
}

export function DocumentGeneratorToolInvocation({
  part,
}: DocumentGeneratorProps) {
  const t = useTranslations();

  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as {
      success: boolean;
      downloadUrl: string;
      filename: string;
      size: number;
      guide: string;
    };
  }, [part.state, part.output]);

  if (!part.state.startsWith("output")) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
        <FileIcon className="size-4 animate-pulse" />
        <span>{t("Chat.Tool.generatingDocument")}...</span>
      </div>
    );
  }

  if (!result || !result.success) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive font-medium">
        <FileIcon className="size-4" />
        <span>
          {t("Common.error")}: {t("Chat.Tool.failedToGenerateDocument")}
        </span>
      </div>
    );
  }

  const fileExtension =
    result.filename.split(".").pop()?.toUpperCase() || "FILE";
  const formattedSize =
    result.size > 1024 * 1024
      ? `${(result.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(result.size / 1024).toFixed(1)} KB`;

  return (
    <div
      className={cn(
        "group/file my-2 animate-in fade-in slide-in-from-bottom-2 duration-500",
      )}
    >
      <div
        className={cn(
          "max-w-sm rounded-2xl border border-border/80 p-4 shadow-sm backdrop-blur-sm bg-card/60 hover:bg-card hover:border-primary/20 transition-all duration-300",
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex-shrink-0 rounded-xl p-3 bg-primary/10 group-hover/file:bg-primary/20 transition-colors duration-300",
            )}
          >
            <FileIcon className="size-6 text-primary" />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <p
              className={cn(
                "text-sm font-semibold truncate text-foreground group-hover/file:text-primary transition-colors duration-300",
              )}
              title={result.filename}
            >
              {result.filename}
            </p>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] uppercase font-bold tracking-tight px-1.5 py-0 border-primary/30 text-primary/80",
                )}
              >
                {fileExtension}
              </Badge>
              <span
                className={cn("text-[11px] text-muted-foreground font-medium")}
              >
                {formattedSize}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "size-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300",
                  )}
                >
                  <a href={result.downloadUrl} download={result.filename}>
                    <Download className="size-4" />
                    <span className="sr-only">Download {result.filename}</span>
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Download
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "size-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300",
                  )}
                >
                  <a
                    href={result.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GlobeIcon className="size-4" />
                    <span className="sr-only">Open {result.filename}</span>
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Open in Browser
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
