"use client";

import type { JSX } from "react";
import {
  bundledLanguages,
  codeToHast,
  type BundledLanguage,
} from "shiki/bundle/web";
import { Fragment, useLayoutEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { safe } from "ts-safe";
import { cn } from "lib/utils";
import { useTheme } from "next-themes";
import { Button } from "ui/button";
import { CheckIcon, CopyIcon, Download } from "lucide-react";
import JsonView from "ui/json-view";
import { useCopy } from "@/hooks/use-copy";
import dynamic from "next/dynamic";
import { safeJSONParse } from "lib/utils";

// Dynamically import chart components for use in fallback rendering
const PieChart = dynamic(
  () => import("./tool-invocation/pie-chart").then((mod) => mod.PieChart),
  { ssr: false },
);
const BarChart = dynamic(
  () => import("./tool-invocation/bar-chart").then((mod) => mod.BarChart),
  { ssr: false },
);
const LineChart = dynamic(
  () => import("./tool-invocation/line-chart").then((mod) => mod.LineChart),
  { ssr: false },
);
const InteractiveTable = dynamic(
  () =>
    import("./tool-invocation/interactive-table").then(
      (mod) => mod.InteractiveTable,
    ),
  { ssr: false },
);

// Dynamically import MermaidDiagram component
const MermaidDiagram = dynamic(
  () => import("./mermaid-diagram").then((mod) => mod.MermaidDiagram),
  {
    loading: () => (
      <div className="text-sm flex bg-accent/30 flex-col rounded-2xl relative my-4 overflow-hidden border">
        <div className="w-full flex z-20 py-2 px-4 items-center">
          <span className="text-sm text-muted-foreground">mermaid</span>
        </div>
        <div className="relative overflow-x-auto px-6 pb-6">
          <div className="h-20 w-full flex items-center justify-center">
            <span className="text-muted-foreground">
              Loading Mermaid renderer...
            </span>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  },
);

const PurePre = ({
  children,
  className,
  code,
  lang,
}: {
  children: any;
  className?: string;
  code: string;
  lang: string;
}) => {
  const { copied, copy } = useCopy();
  const [downloaded, setDownloaded] = useState(false);

  const cleanLang = (lang || "").toLowerCase().trim();
  const isDataOrTabular = cleanLang === "csv" || cleanLang === "tsv";

  const handleDownload = () => {
    try {
      const mimeMap: Record<string, string> = {
        csv: "text/csv;charset=utf-8;",
        tsv: "text/tab-separated-values;charset=utf-8;",
        json: "application/json;charset=utf-8;",
        txt: "text/plain;charset=utf-8;",
        text: "text/plain;charset=utf-8;",
        md: "text/markdown;charset=utf-8;",
        markdown: "text/markdown;charset=utf-8;",
        html: "text/html;charset=utf-8;",
        xml: "application/xml;charset=utf-8;",
        sql: "application/sql;charset=utf-8;",
        js: "application/javascript;charset=utf-8;",
        javascript: "application/javascript;charset=utf-8;",
        ts: "application/typescript;charset=utf-8;",
        typescript: "application/typescript;charset=utf-8;",
        py: "text/x-python;charset=utf-8;",
        python: "text/x-python;charset=utf-8;",
      };
      const mimeType = mimeMap[cleanLang] || "text/plain;charset=utf-8;";
      const ext = cleanLang === "text" ? "txt" : cleanLang || "txt";
      const blob = new Blob([code], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `data-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error("Failed to download file:", err);
    }
  };

  return (
    <pre className={cn("relative", className)}>
      <div className="p-1.5 border-b mb-4 z-20 bg-secondary">
        <div className="w-full flex z-20 py-0.5 px-4 items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground uppercase text-[11px] tracking-wider">
            {lang}
          </span>
          <div className="ml-auto flex items-center gap-1.5 z-10">
            <Button
              size={isDataOrTabular ? "sm" : "icon"}
              variant={downloaded ? "secondary" : "ghost"}
              className={cn(
                "h-7 rounded-sm hover:bg-muted text-xs gap-1.5 font-normal",
                isDataOrTabular ? "px-2" : "w-7",
              )}
              onClick={handleDownload}
              title={`Download as .${cleanLang || "txt"}`}
            >
              {downloaded ? (
                <>
                  <CheckIcon className="size-3.5 text-green-500" />
                  {isDataOrTabular && (
                    <span className="text-[11px]">Downloaded</span>
                  )}
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  {isDataOrTabular && (
                    <span className="text-[11px]">Download CSV</span>
                  )}
                </>
              )}
            </Button>
            <Button
              size="icon"
              variant={copied ? "secondary" : "ghost"}
              className="h-7 w-7 rounded-sm hover:bg-muted"
              onClick={() => {
                copy(code);
              }}
              title="Copy code"
            >
              {copied ? (
                <CheckIcon className="size-3.5" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto px-6 pb-6">{children}</div>
    </pre>
  );
};

export async function Highlight(
  code: string,
  lang: BundledLanguage | (string & {}),
  theme: string,
) {
  const parsed: BundledLanguage = (
    bundledLanguages[lang] ? lang : "md"
  ) as BundledLanguage;

  if (lang === "json") {
    const json = safeJSONParse<any>(code);

    if (json.success && json.value && typeof json.value === "object") {
      const val = json.value;
      let chartType = val.chartType;

      // Auto-detect interactive table if columns and data arrays are present
      if (!chartType && Array.isArray(val.columns) && Array.isArray(val.data)) {
        chartType = "table";
      }

      // Auto-detect bar chart if data items have xAxisLabel and series
      if (
        !chartType &&
        Array.isArray(val.data) &&
        val.data.length > 0 &&
        val.data[0]?.xAxisLabel &&
        Array.isArray(val.data[0]?.series)
      ) {
        chartType = "bar";
      }

      // Auto-detect pie chart if data items have label and numeric value
      if (
        !chartType &&
        Array.isArray(val.data) &&
        val.data.length > 0 &&
        typeof val.data[0]?.label === "string" &&
        typeof val.data[0]?.value === "number"
      ) {
        chartType = "pie";
      }

      if (chartType) {
        const { chartType: _, ...props } = val;
        switch (chartType) {
          case "pie":
            return (
              <PurePre code={code} lang={lang}>
                <PieChart {...props} />
              </PurePre>
            );
          case "bar":
            return (
              <PurePre code={code} lang={lang}>
                <BarChart {...props} />
              </PurePre>
            );
          case "line":
            return (
              <PurePre code={code} lang={lang}>
                <LineChart {...props} />
              </PurePre>
            );
          case "table":
            return (
              <PurePre code={code} lang={lang}>
                <InteractiveTable {...props} />
              </PurePre>
            );
        }
      }
    }

    return (
      <PurePre code={code} lang={lang}>
        <JsonView data={code} initialExpandDepth={3} />
      </PurePre>
    );
  }

  if (lang === "mermaid") {
    return (
      <PurePre code={code} lang={lang}>
        <MermaidDiagram chart={code} />
      </PurePre>
    );
  }

  const out = await codeToHast(code, {
    lang: parsed,
    theme,
  });

  return toJsxRuntime(out, {
    Fragment,
    jsx,
    jsxs,
    components: {
      pre: (props) => <PurePre {...props} code={code} lang={lang} />,
    },
  }) as JSX.Element;
}

export function PreBlock({ children }: { children: any }) {
  const code = children.props.children;
  const { theme } = useTheme();
  const language = children.props.className?.split("-")?.[1] || "bash";
  const [loading, setLoading] = useState(true);
  const [component, setComponent] = useState<JSX.Element | null>(
    <PurePre className="animate-pulse" code={code} lang={language}>
      {children}
    </PurePre>,
  );

  useLayoutEffect(() => {
    safe()
      .map(() =>
        Highlight(
          code,
          language,
          theme == "dark" ? "dark-plus" : "github-light",
        ),
      )
      .ifOk(setComponent)
      .watch(() => setLoading(false));
  }, [theme, language, code]);

  // For other code blocks, render as before
  return (
    <div
      className={cn(
        loading && "animate-pulse",
        "text-sm flex bg-secondary/40 shadow border flex-col rounded relative my-4 overflow-hidden",
      )}
    >
      {component}
    </div>
  );
}
