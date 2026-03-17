"use client";

import { ToolUIPart } from "ai";
import { ExaSearchResponse } from "lib/ai/tools/web/web-search";
import equal from "lib/equal";
import { notify } from "lib/notify";
import { toAny } from "lib/utils";
import { AlertTriangleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { GlobalIcon } from "ui/global-icon";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "ui/hover-card";
import JsonView from "ui/json-view";
import { TextShimmer } from "ui/text-shimmer";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

interface WebSearchToolInvocationProps {
  part: ToolUIPart;
}

function PureWebSearchToolInvocation({ part }: WebSearchToolInvocationProps) {
  const t = useTranslations();

  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as ExaSearchResponse & {
      isError: boolean;
      error?: string;
    };
  }, [part.state]);
  const [errorSrc, setErrorSrc] = useState<string[]>([]);

  const options = useMemo(() => {
    return (
      <HoverCard openDelay={200} closeDelay={0}>
        <HoverCardTrigger asChild>
          <span className="hover:text-primary transition-colors text-xs text-muted-foreground">
            {t("Chat.Tool.searchOptions")}
          </span>
        </HoverCardTrigger>
        <HoverCardContent className="max-w-xs md:max-w-md! w-full! overflow-auto flex flex-col">
          <p className="text-xs text-muted-foreground px-2 mb-2">
            {t("Chat.Tool.searchOptionsDescription")}
          </p>
          <div className="p-2">
            <JsonView data={part.input} />
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }, [part.input]);

  const onError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    if (errorSrc.includes(target.src)) return;
    setErrorSrc([...errorSrc, target.src]);
  };

  const images = useMemo(() => {
    // Exa doesn't provide separate images array, but individual results may have image property
    return (
      result?.results
        ?.filter((r) => r.image && !errorSrc.includes(r.image))
        .map((r) => ({ url: r.image!, description: r.title })) ?? []
    );
  }, [result?.results, errorSrc]);

  if (!part.state.startsWith("output"))
    return (
      <div className="flex items-center gap-2 text-sm">
        <GlobalIcon className="size-5 wiggle text-muted-foreground" />
        <TextShimmer>{t("Chat.Tool.webSearching")}</TextShimmer>
      </div>
    );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <GlobalIcon className="size-5 text-muted-foreground" />
        <span className="text-sm font-semibold">
          {t("Chat.Tool.searchedTheWeb")}
        </span>
        {options}
      </div>
      <div className="flex flex-col gap-3 pb-2 mt-2">
        {Boolean(images?.length) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-2xl">
            {images.map((image, i) => {
              if (!image.url) return null;
              return (
                <Tooltip key={i} delayDuration={500}>
                  <TooltipTrigger asChild>
                    <div
                      key={image.url}
                      onClick={() => {
                        notify.component({
                          className: "max-w-[90vw]! max-h-[90vh]! p-6!",
                          children: (
                            <div className="flex flex-col h-full gap-4">
                              <div className="flex-1 flex items-center justify-center min-h-0 py-6">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={image.url}
                                  className="max-w-[80vw] max-h-[80vh] object-contain rounded-lg shadow-xl"
                                  alt={image.description}
                                  onError={onError}
                                />
                              </div>
                            </div>
                          ),
                        });
                      }}
                      className="group relative aspect-video overflow-hidden rounded-xl border bg-muted shadow-sm hover:shadow-md transition-all cursor-zoom-in"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        loading="lazy"
                        src={image.url}
                        alt={image.description}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={onError}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="p-3 max-w-xs" side="bottom">
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {image.description || image.url}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {result?.isError ? (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangleIcon className="size-3.5" />
              {result.error || "Error"}
            </p>
          ) : (
            (result as ExaSearchResponse)?.results?.map((result, i) => {
              const domain = result.url ? new URL(result.url).hostname : "";
              return (
                <HoverCard key={i} openDelay={100} closeDelay={0}>
                  <HoverCardTrigger asChild>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 rounded-full border bg-secondary/50 px-2.5 py-1.5 text-[11px] font-medium transition-all hover:bg-secondary hover:ring-2 hover:ring-blue-500/50 active:scale-95"
                    >
                      <Avatar className="size-3.5 border shadow-sm">
                        <AvatarImage src={result.favicon} />
                        <AvatarFallback className="text-[8px] bg-muted uppercase">
                          {result.title?.slice(0, 1) || domain.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="max-w-[120px] truncate text-muted-foreground group-hover:text-foreground">
                        {domain}
                      </span>
                    </a>
                  </HoverCardTrigger>

                  <HoverCardContent
                    side="top"
                    className="flex w-80 flex-col gap-2 p-4 shadow-2xl animate-in zoom-in-95 duration-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-5 border shadow-sm">
                        <AvatarImage src={result.favicon} />
                        <AvatarFallback className="text-[10px] bg-muted uppercase">
                          {result.title?.slice(0, 1) || domain.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="line-clamp-1 flex-1 font-semibold text-sm">
                        {result.title || domain}
                      </span>
                    </div>
                    <div className="mt-1 space-y-2">
                      <div className="relative overflow-hidden">
                        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                          {result.text}
                        </p>
                        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-popover to-transparent" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 border-t pt-2">
                        <span className="truncate max-w-[180px]">
                          {result.url}
                        </span>
                        {result.publishedDate && (
                          <span>
                            {new Date(result.publishedDate).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })
          )}
        </div>
        {result?.results?.length && (
          <p className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
            {t("Common.resultsFound", {
              count: result?.results?.length,
            })}
          </p>
        )}
      </div>
    </div>
  );
}

function areEqual(
  { part: prevPart }: WebSearchToolInvocationProps,
  { part: nextPart }: WebSearchToolInvocationProps,
) {
  if (prevPart.state != nextPart.state) return false;
  if (!equal(prevPart.input, nextPart.input)) return false;
  if (
    prevPart.state.startsWith("output") &&
    !equal(prevPart.output, toAny(nextPart).output)
  )
    return false;
  return true;
}

export const WebSearchToolInvocation = memo(
  PureWebSearchToolInvocation,
  areEqual,
);
