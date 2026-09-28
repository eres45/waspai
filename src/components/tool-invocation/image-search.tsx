"use client";

import { ToolUIPart } from "ai";
import { ImageSearchResponse } from "lib/ai/tools/web/image-search";
import { cn } from "lib/utils";
import { ChevronDown, ChevronRight, ExternalLink, Search } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { TextShimmer } from "ui/text-shimmer";

interface ImageSearchToolInvocationProps {
  part: ToolUIPart;
  defaultExpanded?: boolean;
}

export const ImageSearchCard = memo(function ImageSearchCard({
  part,
  defaultExpanded = true,
}: ImageSearchToolInvocationProps) {
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
    return part.output as ImageSearchResponse;
  }, [part.state, part.output]);

  const queryText = input?.query || input?.q || result?.query || "";
  const results = result?.results || [];
  const durationSec = result?.durationMs
    ? `${(result.durationMs / 1000).toFixed(1)}s`
    : `${elapsedSec}s`;

  if (isSearching) {
    return (
      <div className="my-2 flex flex-col w-full max-w-3xl">
        <div className="inline-flex items-center gap-2 text-[13px] text-muted-foreground py-1 px-1 select-none">
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <TextShimmer className="font-normal">Searching images</TextShimmer>
          {queryText && (
            <span className="text-foreground/80 font-medium truncate max-w-[280px]">
              &quot;{queryText}&quot;
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
    <div className="my-2.5 flex flex-col w-full max-w-3xl">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          "inline-flex items-center justify-between gap-3 text-[13px] py-1.5 px-3 rounded-xl transition-all select-none text-left w-full",
          expanded
            ? "bg-secondary/40 ring-1 ring-border/80 text-foreground"
            : "hover:bg-secondary/30 text-muted-foreground",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Search className="size-3.5 text-primary shrink-0" />
          <span className="font-medium text-foreground shrink-0">
            Searched images
          </span>
          {queryText && (
            <span className="text-muted-foreground truncate font-normal">
              &quot;{queryText}&quot;
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
            {durationSec}
          </span>
          {expanded ? (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Image Results Section */}
      {expanded && (
        <div className="mt-2.5 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-foreground/90 tracking-tight">
              Image results
            </span>
            <span className="text-[11px] text-muted-foreground">
              {results.length} photos found
            </span>
          </div>

          {results.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground border border-border/70 rounded-xl bg-card/40 text-center">
              No image results found for &quot;{queryText}&quot;.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 pt-0.5 custom-scrollbar snap-x">
              {results.map((item, idx) => (
                <a
                  key={item.image ? `${item.image}-${idx}` : idx}
                  href={item.image || item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-44 sm:w-48 shrink-0 snap-start rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm overflow-hidden group hover:border-primary/50 hover:shadow-md transition-all flex flex-col no-underline"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-muted/50 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbnail || item.image}
                      alt={item.title || "Search image"}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback if image fails
                        (e.currentTarget as HTMLImageElement).src = item.image;
                      }}
                    />
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs text-white p-1 rounded-md">
                      <ExternalLink className="size-3" />
                    </div>
                  </div>

                  <div className="p-2.5 flex flex-col gap-1 flex-1 justify-between">
                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground truncate font-normal">
                      {item.domain}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
