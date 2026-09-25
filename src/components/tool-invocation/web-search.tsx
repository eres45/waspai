"use client";

import { ToolUIPart } from "ai";
import { WebSearchResponse } from "lib/ai/tools/web/web-search";
import equal from "lib/equal";
import { toAny, cn } from "lib/utils";
import { AlertTriangleIcon, ChevronDown, ChevronRight } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { TextShimmer } from "ui/text-shimmer";

interface WebSearchToolInvocationProps {
  part: ToolUIPart;
}

function getHostname(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function ClaudeSearchBlock({
  part,
  defaultExpanded = true,
}: {
  part: ToolUIPart;
  defaultExpanded?: boolean;
}) {
  const isSearching = !part.state.startsWith("output");
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [elapsedSec, setElapsedSec] = useState(1);

  useEffect(() => {
    if (!isSearching) return;
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsedSec(Math.max(1, Math.floor((Date.now() - start) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [isSearching]);

  const input = (part.input || (part as any).args || {}) as any;

  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as WebSearchResponse & {
      isError?: boolean;
      error?: string;
      isLimitExceeded?: boolean;
      limit?: number;
      used?: number;
      query?: string;
    };
  }, [part.state, part.output]);

  const queryText =
    input?.query ||
    input?.q ||
    input?.search_query ||
    result?.query ||
    (Array.isArray(input?.urls) ? input.urls.join(", ") : "") ||
    "";

  const resultsList = (result?.results ?? []).filter(
    (r) => r.id !== "limit-exceeded",
  );

  if (isSearching) {
    return (
      <div className="my-1.5 flex flex-col">
        <div className="inline-flex items-center gap-2 text-[13px] text-muted-foreground py-1 px-1 select-none">
          <TextShimmer className="font-normal">Searching the web</TextShimmer>
          {queryText && (
            <span className="text-foreground/80 font-medium truncate max-w-[320px] sm:max-w-[460px]">
              {queryText}
            </span>
          )}
          <span className="text-xs text-muted-foreground/80 tabular-nums">
            {elapsedSec}s
          </span>
          <ChevronRight className="size-3.5 text-muted-foreground/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="my-1.5 flex flex-col w-full max-w-2xl">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-2 text-[13px] py-1.5 px-2.5 rounded-lg transition-all select-none text-left w-fit max-w-full",
          expanded
            ? "bg-secondary/30 ring-1 ring-primary/40 text-foreground"
            : "hover:bg-secondary/30 text-muted-foreground",
        )}
      >
        <span className="text-muted-foreground shrink-0">Searched the web</span>
        {queryText && (
          <span className="font-medium text-foreground truncate max-w-[280px] sm:max-w-[440px]">
            {queryText}
          </span>
        )}
        {expanded ? (
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="mt-1.5 rounded-xl border border-border/70 bg-card/50 backdrop-blur-sm p-2 flex flex-col gap-0.5 max-h-[320px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
          {result?.isLimitExceeded ? (
            <div className="px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangleIcon className="size-4 shrink-0 text-amber-400" />
                <span>
                  Daily Free limit reached ({result.used || 10}/
                  {result.limit || 10} web searches today • resets at 4:00 AM
                  IST). Upgrade to Pro for unlimited web search.
                </span>
              </div>
              <a
                href="/subscription"
                className="shrink-0 px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium transition-colors no-underline"
              >
                Upgrade Plan →
              </a>
            </div>
          ) : result?.isError ? (
            <div className="px-3 py-2 text-xs text-destructive flex items-center gap-1.5">
              <AlertTriangleIcon className="size-3.5 shrink-0" />
              <span>{result.error || "Search failed"}</span>
            </div>
          ) : resultsList.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              No web sources returned for this query.
            </div>
          ) : (
            resultsList.map((item, idx) => {
              const domain = getHostname(item.url);
              const faviconSrc =
                item.favicon ||
                (domain
                  ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
                  : "");
              return (
                <a
                  key={item.url ? `${item.url}-${idx}` : idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 px-2.5 py-1.5 rounded-lg hover:bg-muted/60 transition-colors group no-underline"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {faviconSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={faviconSrc}
                        alt=""
                        className="size-4 rounded-[3px] shrink-0 object-contain bg-muted/30"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="size-4 rounded-[3px] shrink-0 bg-muted flex items-center justify-center text-[9px] font-semibold uppercase text-muted-foreground">
                        {(item.title || domain || "W").slice(0, 1)}
                      </div>
                    )}
                    <span className="text-[13px] text-foreground/90 group-hover:text-foreground truncate font-normal">
                      {item.title || domain || item.url}
                    </span>
                  </div>
                  {domain && (
                    <span className="text-xs text-muted-foreground/80 group-hover:text-muted-foreground shrink-0 font-normal">
                      {domain}
                    </span>
                  )}
                </a>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function PureWebSearchToolInvocation({ part }: WebSearchToolInvocationProps) {
  return <ClaudeSearchBlock part={part} defaultExpanded={true} />;
}

function areEqual(
  { part: prevPart }: WebSearchToolInvocationProps,
  { part: nextPart }: WebSearchToolInvocationProps,
) {
  if (prevPart.state !== nextPart.state) return false;
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

export interface GroupedWebSearchToolInvocationProps {
  parts: ToolUIPart[];
}

export function PureGroupedWebSearchToolInvocation({
  parts,
}: GroupedWebSearchToolInvocationProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {parts.map((part, idx) => (
        <ClaudeSearchBlock
          key={part.toolCallId || idx}
          part={part}
          defaultExpanded={idx === parts.length - 1}
        />
      ))}
    </div>
  );
}

function areGroupedEqual(
  prevProps: GroupedWebSearchToolInvocationProps,
  nextProps: GroupedWebSearchToolInvocationProps,
) {
  if (prevProps.parts.length !== nextProps.parts.length) return false;
  for (let i = 0; i < prevProps.parts.length; i++) {
    const prevPart = prevProps.parts[i];
    const nextPart = nextProps.parts[i];
    if (prevPart.state !== nextPart.state) return false;
    if (!equal(prevPart.input, nextPart.input)) return false;
    if (
      prevPart.state.startsWith("output") &&
      !equal(prevPart.output, toAny(nextPart).output)
    )
      return false;
  }
  return true;
}

export const GroupedWebSearchToolInvocation = memo(
  PureGroupedWebSearchToolInvocation,
  areGroupedEqual,
);
