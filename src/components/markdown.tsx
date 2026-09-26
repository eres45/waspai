"use client";

import React, { memo, PropsWithChildren } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { PreBlock } from "./pre-block";
import { cn, isString, toAny } from "lib/utils";
import { LinkIcon, Download } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "ui/table";

const FadeIn = memo(({ children }: PropsWithChildren) => {
  return <span className="fade-in animate-in duration-1000">{children} </span>;
});
FadeIn.displayName = "FadeIn";

export const WordByWordFadeIn = memo(({ children }: PropsWithChildren) => {
  const childrens = [children]
    .flat()
    .flatMap((child) => (isString(child) ? child.split(" ") : child));
  return childrens.map((word, index) =>
    isString(word) ? <FadeIn key={index}>{word}</FadeIn> : word,
  );
});
WordByWordFadeIn.displayName = "WordByWordFadeIn";
const KNOWN_PUBLICATION_LABELS: Record<string, string> = {
  "coinmarketcap.com": "CoinMarketCap",
  "coindesk.com": "CoinDesk",
  "coinbase.com": "Coinbase",
  "binance.com": "Binance",
  "coingecko.com": "CoinGecko",
  "finance.yahoo.com": "Yahoo Finance",
  "yahoo.com": "Yahoo",
  "reuters.com": "Reuters",
  "bloomberg.com": "Bloomberg",
  "cnbc.com": "CNBC",
  "investing.com": "Investing.com",
  "tradingview.com": "TradingView",
  "kraken.com": "Kraken",
  "forbes.com": "Forbes",
  "techcrunch.com": "TechCrunch",
  "theverge.com": "The Verge",
  "github.com": "GitHub",
  "wikipedia.org": "Wikipedia",
};

function getCleanDomainLabel(domain: string, fallbackText: string): string {
  const cleanDomain = domain.toLowerCase().replace(/^www\./, "");
  if (KNOWN_PUBLICATION_LABELS[cleanDomain]) {
    return KNOWN_PUBLICATION_LABELS[cleanDomain];
  }
  for (const [key, label] of Object.entries(KNOWN_PUBLICATION_LABELS)) {
    if (cleanDomain.endsWith(`.${key}`)) return label;
  }
  const trimmed = fallbackText
    .replace(/^【|】$/g, "")
    .replace(/^\[|\]$/g, "")
    .trim();
  if (
    trimmed &&
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://") &&
    !trimmed.includes("://") &&
    trimmed.toLowerCase() !== "source" &&
    trimmed.length <= 28
  ) {
    return trimmed;
  }
  if (cleanDomain) {
    const base = cleanDomain.split(".")[0] || cleanDomain;
    return base.charAt(0).toUpperCase() + base.slice(1);
  }
  return trimmed || "Source";
}

const CANONICAL_SOURCE_URLS: Record<string, { label: string; url: string }> = {
  coinmarketcap: {
    label: "CoinMarketCap",
    url: "https://coinmarketcap.com",
  },
  coindesk: {
    label: "CoinDesk",
    url: "https://www.coindesk.com",
  },
  coinbase: {
    label: "Coinbase",
    url: "https://www.coinbase.com",
  },
  binance: {
    label: "Binance",
    url: "https://www.binance.com",
  },
  coingecko: {
    label: "CoinGecko",
    url: "https://www.coingecko.com",
  },
  "yahoo finance": {
    label: "Yahoo Finance",
    url: "https://finance.yahoo.com",
  },
  reuters: {
    label: "Reuters",
    url: "https://www.reuters.com",
  },
  bloomberg: {
    label: "Bloomberg",
    url: "https://www.bloomberg.com",
  },
  tradingview: {
    label: "TradingView",
    url: "https://www.tradingview.com",
  },
  investing: {
    label: "Investing.com",
    url: "https://www.investing.com",
  },
  "investing.com": {
    label: "Investing.com",
    url: "https://www.investing.com",
  },
  kraken: {
    label: "Kraken",
    url: "https://www.kraken.com",
  },
};

export function normalizeMarkdownCitations(raw: string): string {
  if (!raw || typeof raw !== "string") return raw;
  return (
    raw
      // Convert 【Label】 (https://...) or 【Label】(https://...) -> [Label](https://...)
      .replace(
        /【([^】]+)】\s*\(\s*(https?:\/\/[^\s)]+)\s*\)/g,
        (_, label, url) => ` [${label.trim()}](${url.trim()})`,
      )
      // Convert [Label] (https://...) with accidental space between ] and ( -> [Label](https://...)
      .replace(
        /\[([^\]]+)\]\s+\(\s*(https?:\/\/[^\s)]+)\s*\)/g,
        (_, label, url) => `[${label.trim()}](${url.trim()})`,
      )
      // Convert 【https://...】 -> [Source](https://...)
      .replace(
        /【\s*(https?:\/\/[^\s】]+)\s*】/g,
        (_, url) => ` [Source](${url.trim()})`,
      )
      // Convert bare parenthesized URLs (https://...) not preceded by ] into [Source](https://...)
      .replace(
        /(?<!\])\(\s*(https?:\/\/[^\s)]+)\s*\)/g,
        (_, url) => ` [Source](${url.trim()})`,
      )
      // Convert standalone 【Source】 into clickable [Source](https://...) pills
      .replace(/【([^】]{1,48})】/g, (_, inner) => {
        const clean = String(inner).trim();
        const key = clean.toLowerCase();
        if (CANONICAL_SOURCE_URLS[key]) {
          return ` [${CANONICAL_SOURCE_URLS[key].label}](${CANONICAL_SOURCE_URLS[key].url})`;
        }
        if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(clean)) {
          return ` [${clean}](https://${clean})`;
        }
        return "";
      })
      // Sanitize internal storage proxy and worker URLs into safe local download anchors
      .replace(
        /https:\/\/[a-zA-Z0-9-]+\.(?:waspproxy|llamai|rutv|hhhlproxy)\.workers\.dev[^\s)"]*/g,
        (match) => {
          const fileMatch = match.match(
            /([a-zA-Z0-9_.-]+\.(?:csv|tsv|json|txt|pdf|docx|png|jpg|jpeg))/i,
          );
          const fname = fileMatch ? fileMatch[1] : "data.csv";
          return `#download-${fname}`;
        },
      )
  );
}

const components: Partial<Components> = {
  table: ({ node, children, ...props }) => {
    return (
      <div className="my-4">
        <Table {...props}>{children}</Table>
      </div>
    );
  },
  thead: ({ node, children, ...props }) => {
    return <TableHeader {...props}>{children}</TableHeader>;
  },
  tbody: ({ node, children, ...props }) => {
    return <TableBody {...props}>{children}</TableBody>;
  },
  tr: ({ node, children, ...props }) => {
    return <TableRow {...props}>{children}</TableRow>;
  },
  th: ({ node, children, ...props }) => {
    return (
      <TableHead {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </TableHead>
    );
  },
  td: ({ node, children, ...props }) => {
    return (
      <TableCell {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </TableCell>
    );
  },
  code: ({ children }) => {
    return (
      <code className="text-sm rounded-md bg-accent text-primary py-1 px-2 mx-0.5">
        {children}
      </code>
    );
  },
  blockquote: ({ children }) => {
    return (
      <div className="px-4">
        <blockquote className="relative bg-accent/30 p-6 rounded-2xl my-6 overflow-hidden border">
          <WordByWordFadeIn>{children}</WordByWordFadeIn>
        </blockquote>
      </div>
    );
  },
  p: ({ children }) => {
    return (
      <p className="leading-6 my-2 first:mt-0 last:mb-0 break-words">
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </p>
    );
  },
  pre: ({ children }) => {
    return (
      <div className="px-4 py-2">
        <PreBlock>{children}</PreBlock>
      </div>
    );
  },
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="px-8 list-decimal list-outside" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-1.5 break-words" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="px-8 list-outside list-disc" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </span>
    );
  },
  a: ({ node, children, ...props }) => {
    const rawHref = ((props as any)?.href || "").replace(/[),.;]+$/, "");
    const isDownloadAction =
      rawHref.startsWith("#download-") ||
      rawHref.includes("/file/placeholder") ||
      rawHref.includes("placeholder") ||
      ((rawHref.includes("workers.dev") || rawHref.includes("waspproxy")) &&
        /\.(csv|tsv|json|txt|md)/i.test(rawHref));

    let domain = "";
    try {
      if (rawHref.startsWith("http") && !isDownloadAction) {
        domain = new URL(rawHref).hostname.replace(/^www\./, "");
      }
    } catch {}

    const rawText = React.Children.toArray(children)
      .map((c) =>
        typeof c === "string" || typeof c === "number" ? String(c) : "",
      )
      .join("")
      .trim();

    let displayLabel = "";
    let downloadFilename = "schedule.csv";

    if (isDownloadAction) {
      if (rawHref.startsWith("#download-")) {
        downloadFilename = decodeURIComponent(
          rawHref.replace("#download-", ""),
        );
      } else {
        const match = rawHref.match(
          /([a-zA-Z0-9_.-]+\.(?:csv|tsv|json|txt|md))/i,
        );
        if (match) downloadFilename = match[1];
      }
      displayLabel =
        rawText && rawText.toLowerCase() !== "source"
          ? rawText
          : downloadFilename;
    } else {
      displayLabel = getCleanDomainLabel(domain, rawText);
    }

    const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isDownloadAction) return;
      e.preventDefault();
      e.stopPropagation();

      try {
        const article = e.currentTarget.closest("article");
        let fileContent = "";

        if (article) {
          // 1. Look for pre/code elements containing tabular or CSV data
          const preElements = article.querySelectorAll("pre");
          for (const pre of Array.from(preElements)) {
            const text = pre.textContent || "";
            if (
              text.includes(",") ||
              text.includes("\t") ||
              text.includes("\n")
            ) {
              fileContent = text;
              break;
            }
          }

          if (!fileContent) {
            const codeElements = article.querySelectorAll("code");
            for (const code of Array.from(codeElements)) {
              const text = code.textContent || "";
              if (text.includes(",") && text.includes("\n")) {
                fileContent = text;
                break;
              }
            }
          }

          // 2. Look for HTML table and convert to CSV if no pre/code found
          if (!fileContent) {
            const table = article.querySelector("table");
            if (table) {
              const rows = Array.from(table.querySelectorAll("tr"));
              fileContent = rows
                .map((tr) =>
                  Array.from(tr.querySelectorAll("th, td"))
                    .map((cell) => {
                      const val = (cell.textContent || "").trim();
                      return `"${val.replace(/"/g, '""')}"`;
                    })
                    .join(","),
                )
                .join("\n");
            }
          }

          // 3. Fallback to article text if needed
          if (!fileContent) {
            fileContent = article.textContent || "";
          }
        }

        if (fileContent) {
          const ext = downloadFilename.split(".").pop()?.toLowerCase() || "csv";
          const mime =
            ext === "tsv"
              ? "text/tab-separated-values;charset=utf-8;"
              : ext === "json"
                ? "application/json;charset=utf-8;"
                : "text/csv;charset=utf-8;";
          const blob = new Blob([fileContent], { type: mime });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = downloadFilename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        console.error("Failed to download CSV from link click:", err);
      }
    };

    return (
      <a
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-full text-[11px] font-medium bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60 transition-colors align-baseline no-underline leading-tight max-w-[200px]",
          isDownloadAction &&
            "cursor-pointer hover:border-primary/60 hover:text-primary active:scale-95 font-semibold",
        )}
        target={isDownloadAction ? undefined : "_blank"}
        rel={isDownloadAction ? undefined : "noreferrer"}
        {...toAny(props)}
        href={isDownloadAction ? `#` : rawHref}
        onClick={isDownloadAction ? handleDownloadClick : undefined}
        title={isDownloadAction ? `Download ${downloadFilename}` : rawHref}
      >
        {isDownloadAction ? (
          <Download className="size-3 shrink-0 text-primary" />
        ) : domain ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
            alt=""
            className="size-3 rounded-[2px] shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <LinkIcon className="size-3 shrink-0" />
        )}
        <span className="truncate">{displayLabel}</span>
      </a>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-2xl font-semibold mt-5 mb-2" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="text-xl font-semibold mt-5 mb-2" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="text-lg font-semibold mt-4 mb-1.5" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-base font-semibold mt-4 mb-1.5" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-sm font-semibold mt-3 mb-1" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-xs font-semibold mt-3 mb-1" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </h6>
    );
  },
  img: ({ node, children, ...props }) => {
    const { src, alt, ...rest } = props;
    const srcStr = typeof src === "string" ? src.trim() : "";
    if (
      !srcStr ||
      srcStr.startsWith("attachment:") ||
      srcStr.startsWith("sandbox:") ||
      (!srcStr.startsWith("http://") &&
        !srcStr.startsWith("https://") &&
        !srcStr.startsWith("data:") &&
        !srcStr.startsWith("/"))
    ) {
      return null;
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className="mx-auto rounded-lg" src={srcStr} alt={alt} {...rest} />
    );
  },
};

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const normalizedChildren = normalizeMarkdownCitations(children);
  return (
    <article className="w-full h-full relative">
      <ReactMarkdown
        components={components}
        remarkPlugins={[
          remarkGfm,
          [remarkMath, { singleDollarTextMath: false }],
        ]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalizedChildren}
      </ReactMarkdown>
    </article>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
