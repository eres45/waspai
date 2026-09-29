import { useCopy } from "@/hooks/use-copy";
import { ToolUIPart } from "ai";

import { callCodeRunWorker } from "lib/code-runner/call-worker";

import {
  CodeRunnerResult,
  LogEntry,
} from "lib/code-runner/code-runner.interface";
import { cn, isString, toAny } from "lib/utils";
import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronRight,
  CopyIcon,
  Loader,
  Percent,
  PlayIcon,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { safe } from "ts-safe";

import {
  PresentedFile,
  PresentedFileCard,
} from "@/components/chat/presented-file-card";
import { CodeBlock } from "ui/CodeBlock";
import { Skeleton } from "ui/skeleton";
import { TextShimmer } from "ui/text-shimmer";

export const CodeExecutor = memo(function CodeExecutor({
  part,
  onResult,
  type,
}: {
  part: ToolUIPart;
  onResult?: (result?: any) => void;
  type: "javascript" | "python";
}) {
  const isRun = useRef(false);

  const { copy, copied } = useCopy();
  const [isExecuting, setIsExecuting] = useState(false);

  const lastStartedAt = useRef<number>(Date.now());

  const [realtimeLogs, setRealtimeLogs] = useState<
    (CodeRunnerResult["logs"][number] & { time: number })[]
  >([]);

  const codeResultContainerRef = useRef<HTMLDivElement>(null);

  const runCode = useCallback(
    async (code: string, type: "javascript" | "python") => {
      lastStartedAt.current = Date.now();
      const result = await callCodeRunWorker(type, {
        code,
        timeout: 30000,
        onLog: (log) => {
          setRealtimeLogs((prev) => [...prev, { ...log, time: Date.now() }]);
        },
      });
      return result;
    },
    [],
  );

  const menualToolCall = useCallback(
    async (code: string) => {
      const result = await runCode(code, type);

      // Extract generated files and sanitize logs for LLM consumption (strip massive base64)
      const harvestedFiles: PresentedFile[] = [];
      const sanitizedLogs: LogEntry[] = [];

      for (const log of result.logs || []) {
        const sanitizedArgs: LogEntry["args"] = [];

        for (const arg of log.args || []) {
          if (arg.type === "file" && arg.value) {
            harvestedFiles.push({
              name: arg.value.name,
              size: arg.value.size,
              mime_type: arg.value.mime_type,
              dataUrl: arg.value.dataUrl,
              url: (arg.value as any)?.url,
              content: (arg.value as any)?.content,
            });
            sanitizedArgs.push({
              type: "data",
              value: `[File '${arg.value.name}' (${Math.round((arg.value.size || 0) / 1024)} KB) successfully generated and presented to user with preview & download card]`,
            });
          } else if (arg.type === "image") {
            sanitizedArgs.push({
              type: "data",
              value:
                "[Image output rendered successfully and displayed in chat UI]",
            });
          } else if (arg.type === "data") {
            const valStr = isString(arg.value)
              ? arg.value
              : JSON.stringify(arg.value);
            sanitizedArgs.push({
              type: "data",
              value:
                valStr.length > 2000 ? `${valStr.slice(0, 1997)}...` : valStr,
            });
          } else {
            sanitizedArgs.push(arg);
          }
        }

        sanitizedLogs.push({
          ...log,
          args: sanitizedArgs,
        });
      }

      const fileNames = harvestedFiles.map((f) => f.name);
      const guide =
        harvestedFiles.length > 0
          ? `Execution finished successfully. File(s) [${fileNames.join(", ")}] were automatically captured and are ALREADY displayed and presented to the user with interactive preview and download cards in the UI. The user can see and download them right now. DO NOT run another script to re-read or base64-encode these files, and DO NOT claim the files were not generated. Provide a clean summary of what was generated.`
          : "Execution finished. Provide: 1) Main results/outputs 2) Key insights or findings 3) Error explanations if any. Don't repeat code or raw logs - interpret and summarize for the user.";

      onResult?.({
        success: result.success,
        executionTimeMs: result.executionTimeMs,
        error: result.error,
        filesGenerated: fileNames,
        files: harvestedFiles,
        logs: sanitizedLogs,
        guide,
      });
    },
    [runCode, type, onResult],
  );
  const isRunning = useMemo(() => {
    return isExecuting || part.state.startsWith("input");
  }, [isExecuting, part.state]);

  const scrollToCode = useCallback(() => {
    codeResultContainerRef.current?.scrollTo({
      top: codeResultContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const result = useMemo(() => {
    if (part.state?.startsWith("input")) return null;
    const raw =
      (part as any).output ??
      (part as any).result ??
      (part as any).toolInvocation?.result;
    return raw as CodeRunnerResult & {
      files?: PresentedFile[];
      filesGenerated?: string[];
    };
  }, [part]);

  const logs = useMemo(() => {
    const error = result?.error;
    const logs: (LogEntry & { time?: number })[] = realtimeLogs.length
      ? realtimeLogs
      : (result?.logs ?? []);

    if (error) {
      logs.push({
        type: "error",
        args: [{ type: "data", value: error }],
        time: lastStartedAt.current,
      });
    }

    return logs.map((log, i) => {
      return (
        <div
          key={i}
          className={cn(
            "flex gap-1 text-muted-foreground pl-3",
            log.type == "error" && "text-destructive",
            log.type == "warn" && "text-yellow-500",
          )}
        >
          <div className="w-[8.6rem] hidden md:block">
            {new Date(toAny(log).time || Date.now()).toISOString()}
          </div>
          <div className="h-[15px] flex items-center">
            {log.type == "error" ? (
              <AlertTriangleIcon className="size-2" />
            ) : log.type == "warn" ? (
              <AlertTriangleIcon className="size-2" />
            ) : (
              <ChevronRight className="size-2" />
            )}
          </div>
          <div className="flex-1 min-w-0 whitespace-pre-wrap gap-1">
            {log.args.map((arg, i) => {
              if (arg.type == "image") {
                /* eslint-disable-next-line @next/next/no-img-element */
                return (
                  <img
                    key={i}
                    src={arg.value}
                    alt="Code output"
                    className="max-h-72 rounded-lg my-1.5 object-contain"
                  />
                );
              }
              if (arg.type == "file") {
                const file = arg.value;
                return (
                  <div key={i} className="my-1.5 max-w-lg">
                    <PresentedFileCard file={file} showCategoryLabel={false} />
                  </div>
                );
              }
              return (
                <span key={i}>
                  {isString(arg?.value)
                    ? arg.value.toString()
                    : JSON.stringify(arg.value ?? arg)}
                </span>
              );
            })}
          </div>
        </div>
      );
    });
  }, [part, realtimeLogs]);

  const getCodeFromInput = useCallback((input: any): string => {
    const inp = toAny(input);
    if (!inp) return "";
    if (typeof inp === "string") return inp;
    return (
      inp.code || inp.script || inp.command || inp.input || inp.python || ""
    );
  }, []);

  const getCodeFromPart = useCallback(
    (p: any): string => {
      const inp = p?.input ?? p?.args ?? p?.toolInvocation?.args;
      return getCodeFromInput(inp);
    },
    [getCodeFromInput],
  );

  const reExecute = useCallback(async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setRealtimeLogs([
      {
        type: "log",
        args: [{ type: "data", value: "Re-executing code..." }],
        time: Date.now(),
      },
    ]);
    const code = getCodeFromPart(part);

    safe(async () => {
      await menualToolCall(code);
    }).watch(() => setIsExecuting(false));
  }, [part, isExecuting, getCodeFromPart, menualToolCall]);

  const harvestedFiles = useMemo(() => {
    // 1. Direct files from output/result (persisted in DB or onResult)
    if (
      result?.files &&
      Array.isArray(result.files) &&
      result.files.length > 0
    ) {
      return result.files;
    }
    // 2. Extracted from logs (realtime or persisted)
    const list: PresentedFile[] = [];
    const sourceLogs = realtimeLogs.length
      ? realtimeLogs
      : (result?.logs ?? []);
    for (const log of sourceLogs) {
      if (!log.args) continue;
      for (const arg of log.args) {
        if (arg.type === "file" && arg.value) {
          list.push(arg.value);
        }
      }
    }
    return list;
  }, [result, realtimeLogs]);

  const header = useMemo(() => {
    if (isRunning)
      return (
        <>
          <Loader className="size-3 animate-spin text-muted-foreground" />
          <TextShimmer className="text-xs">
            {harvestedFiles.length === 0 && result
              ? "Restoring files..."
              : "Generating Code..."}
          </TextShimmer>
        </>
      );
    return (
      <>
        {result?.error ? (
          <>
            <AlertTriangleIcon className="size-3 text-destructive" />
            <span className="text-destructive text-xs">ERROR</span>
          </>
        ) : (
          <div className="text-[7px] bg-input rounded-xs w-4 h-4 p-0.5 flex items-end justify-end font-bold">
            {type == "javascript" ? "JS" : type == "python" ? "PY" : ">_"}
          </div>
        )}
      </>
    );
  }, [result, isRunning, harvestedFiles.length, type]);

  const fallback = useMemo(() => {
    return <CodeFallback />;
  }, []);

  const logContainer = useMemo(() => {
    if (!logs.length) return null;
    return (
      <div className="p-4 text-[10px] text-foreground flex flex-col gap-1 border-t">
        <div className="text-foreground flex items-center gap-1">
          {isRunning ? (
            <Loader className="size-2 animate-spin" />
          ) : (
            <div className="w-1 h-1 mr-1 ring ring-border rounded-full" />
          )}
          WaspAI
          <Percent className="size-2" />
        </div>
        {logs}
        {isRunning && (
          <div className="ml-3 animate-caret-blink text-muted-foreground">
            |
          </div>
        )}
      </div>
    );
  }, [logs, isRunning]);

  const isCompleted = useMemo(() => {
    return (
      !isRunning &&
      (part.state?.startsWith("output") ||
        (part.state as string) === "result" ||
        result !== null)
    );
  }, [isRunning, part.state, result]);

  // Initial auto-execution when input is available
  useEffect(() => {
    const code = getCodeFromPart(part);
    if (
      onResult &&
      code &&
      part.state === "input-available" &&
      !isRun.current
    ) {
      isRun.current = true;
      menualToolCall(code);
    }
  }, [part, onResult, getCodeFromPart, menualToolCall]);

  // Auto-recover files if code was executed previously but files are missing from output (e.g. after page refresh)
  useEffect(() => {
    const code = getCodeFromPart(part);
    const hasFiles = harvestedFiles.length > 0;
    const isFinished =
      part.state?.startsWith("output") ||
      (part.state as string) === "result" ||
      result !== null;

    const needsRecovery =
      isFinished &&
      !hasFiles &&
      !isRun.current &&
      !isExecuting &&
      code &&
      (result?.filesGenerated?.length ||
        result?.logs?.some((l) =>
          l.args?.some(
            (a) =>
              a.type === "file" ||
              (a.type === "data" &&
                typeof a.value === "string" &&
                a.value.includes("[File '")),
          ),
        ));

    if (needsRecovery) {
      isRun.current = true;
      menualToolCall(code);
    }
  }, [
    harvestedFiles.length,
    isExecuting,
    part,
    result,
    getCodeFromPart,
    menualToolCall,
  ]);

  useEffect(() => {
    if (isRunning) {
      const closeKey = setInterval(scrollToCode, 300);
      return () => clearInterval(closeKey);
    } else if (isCompleted && isRun.current) {
      scrollToCode();
    }
  }, [isRunning, isCompleted, scrollToCode]);

  return (
    <div className="flex flex-col">
      <div className="px-6 py-3">
        <div className="border overflow-x-hidden relative rounded-lg shadow fade-in animate-in duration-500">
          <div className="py-2.5 bg-border px-4 flex items-center gap-1.5 z-10 min-h-[37px]">
            {header}
            <div className="flex-1" />

            {isCompleted && (
              <>
                <div
                  className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1 transition-all rounded-sm cursor-pointer hover:bg-input hover:text-foreground font-semibold"
                  onClick={reExecute}
                >
                  <PlayIcon className="size-2" />
                  Run
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1 transition-all rounded-sm cursor-pointer hover:bg-input hover:text-foreground font-semibold"
                  onClick={() => copy(getCodeFromPart(part))}
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
          <div className="relative">
            <div className="absolute pointer-events-none top-0 left-0 w-full h-1/6 bg-gradient-to-b from-background to-transparent z-10" />
            <div className="absolute pointer-events-none bottom-0 left-0 w-full h-1/6 bg-gradient-to-t from-background to-transparent z-10" />
            <div className="absolute pointer-events-none top-0 left-0 w-1/6 h-full bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute pointer-events-none top-0 right-0 w-1/6 h-full bg-gradient-to-l from-background to-transparent z-10" />
            <div
              className="min-h-14 p-6 text-xs overflow-y-auto max-h-[40vh]"
              ref={codeResultContainerRef}
            >
              <CodeBlock
                className="p-4 text-[10px] overflow-x-auto"
                code={getCodeFromInput(part.input)}
                lang={type}
                fallback={fallback}
              />
            </div>
          </div>
          {logContainer}
        </div>

        {harvestedFiles.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {harvestedFiles.map((file, idx) => (
              <PresentedFileCard
                key={idx}
                file={file}
                showCategoryLabel={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

function CodeFallback() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-1/6" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}
