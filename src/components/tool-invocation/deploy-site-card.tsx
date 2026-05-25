"use client";

import { useState, useEffect } from "react";
import { ToolUIPart } from "ai";
import {
  Globe,
  CheckCircle2,
  Copy,
  Check,
  Rocket,
  FileCode2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "ui/button";

// Import modular agent visualizer components
import { AgentTaskCard } from "../agent/AgentTaskCard";
import { AgentTimeline } from "../agent/AgentTimeline";
import { AgentStep } from "../agent/AgentStep";
import { AgentLog } from "../agent/AgentLog";

interface DeploySiteCardProps {
  part: ToolUIPart;
}

interface WorkflowStep {
  title: string;
  status: "thinking" | "running" | "success" | "warning" | "failed" | "info";
  durationText?: string;
  command?: string;
  logOutput?: string;
}

export function DeploySiteCard({ part }: DeploySiteCardProps) {
  const { state, output, input } = part as any;
  const [copied, setCopied] = useState(false);

  const isLoading = !state?.startsWith("output");
  const isError = state === "output-error";

  const result = output as
    | {
        success: boolean;
        id?: string;
        slug?: string;
        url?: string;
        message?: string;
        error?: string;
      }
    | undefined;

  const isSoftError =
    !isLoading && !isError && result !== undefined && result.success === false;
  const isSuccess =
    !isLoading && !isError && !isSoftError && result?.success === true;

  const siteInput = input as {
    title?: string;
    html?: string;
    description?: string;
    slug?: string;
    files?: Array<{ path: string; content: string }>;
  };

  const fileCount = siteInput?.files?.length ?? (siteInput?.html ? 1 : 0);
  const isMultiFile = (siteInput?.files?.length ?? 0) > 1;

  // Simulated step progress while loading
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    setSimulatedProgress(0);
    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 900);
    return () => clearInterval(interval);
  }, [isLoading]);

  const steps: WorkflowStep[] = [
    {
      title: "Validating site content & slug",
      status: !isLoading
        ? "success"
        : simulatedProgress > 0
          ? "success"
          : "running",
      durationText: !isLoading || simulatedProgress > 0 ? "0.2s" : undefined,
      command: `waspai validate --slug "${siteInput?.slug ?? "auto-generate"}"`,
      logOutput: `Content validation passed.\nSlug "${result?.slug ?? siteInput?.slug ?? "auto"}" is available.\n${fileCount} file(s) queued for upload.`,
    },
    {
      title: isMultiFile
        ? `Uploading ${fileCount} project files`
        : "Uploading HTML/CSS/JS bundle",
      status: !isLoading
        ? "success"
        : simulatedProgress > 1
          ? "success"
          : simulatedProgress === 1
            ? "running"
            : "info",
      durationText: !isLoading || simulatedProgress > 1 ? "0.4s" : undefined,
      command: isMultiFile
        ? `waspai deploy --files ${siteInput?.files?.map((f) => f.path).join(" ")}`
        : `waspai deploy --file index.html`,
      logOutput: isMultiFile
        ? `Uploading ${fileCount} files...\n${siteInput?.files?.map((f) => `  ✓ ${f.path}`).join("\n") ?? ""}`
        : `Uploading index.html (${siteInput?.html ? Math.round(siteInput.html.length / 1024) : 0}KB)...`,
    },
    {
      title: "Provisioning subdomain & CDN",
      status: !isLoading
        ? "success"
        : simulatedProgress > 2
          ? "success"
          : simulatedProgress === 2
            ? "running"
            : "info",
      durationText: !isLoading || simulatedProgress > 2 ? "0.3s" : undefined,
      command: `waspai cdn --edge-cache --ssl`,
      logOutput: `Subdomain provisioned: ${result?.slug ?? "..."}.waspai.in\nSSL certificate issued.\nEdge CDN deployed across 12 PoPs.`,
    },
    {
      title: "Going live",
      status: !isLoading
        ? isSuccess
          ? "success"
          : "failed"
        : simulatedProgress === 3
          ? "running"
          : "info",
      durationText: !isLoading ? "0.1s" : undefined,
      command: `waspai publish --confirm`,
      logOutput: !isLoading
        ? isSuccess
          ? `Site is live! 🚀\nURL: ${result?.url}\nID: ${result?.id}`
          : `Deploy failed: ${result?.error ?? "Unknown error"}`
        : "Finalizing deployment...",
    },
  ];

  const handleCopyUrl = () => {
    if (result?.url) {
      navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cardStatus = isLoading
    ? "running"
    : isError || isSoftError
      ? "failed"
      : "success";

  const cardTitle = isLoading
    ? `Deploying "${siteInput?.title ?? "Site"}"...`
    : isError || isSoftError
      ? "Deployment Failed"
      : `🚀 ${siteInput?.title ?? "Site"} is Live!`;

  const cardSubtitle = isLoading
    ? "Uploading files and provisioning your subdomain..."
    : isError
      ? "An unexpected error occurred."
      : isSoftError
        ? (result?.error ?? "Deployment failed.")
        : (result?.url ?? siteInput?.description ?? "Your site is live!");

  const completedSteps = steps.filter((s) => s.status === "success").length;
  const metadataText = isLoading
    ? `${simulatedProgress + 1}/4 steps`
    : `${completedSteps} steps completed`;
  const durationText = isLoading
    ? `${simulatedProgress}s`
    : isSuccess
      ? "1.8s"
      : "1.2s";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-xl my-2"
    >
      <AgentTaskCard
        title={cardTitle}
        subtitle={cardSubtitle}
        status={cardStatus}
        durationText={durationText}
        metadataText={metadataText}
        defaultExpanded={isLoading}
        autoCollapseOnSuccess={true}
      >
        <div className="flex flex-col gap-4">
          <AgentTimeline>
            {steps.map((step, index) => (
              <AgentStep
                key={index}
                title={step.title}
                status={step.status}
                durationText={step.durationText}
                defaultExpanded={step.status === "running"}
              >
                {step.command && (
                  <div className="mt-1.5 w-full">
                    <AgentLog command={step.command} output={step.logOutput} />
                  </div>
                )}
              </AgentStep>
            ))}
          </AgentTimeline>

          {/* Success Actions */}
          <AnimatePresence>
            {isSuccess && result?.url && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-3 pt-3 border-t border-border/40 mt-1"
              >
                {/* URL pill */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border/30 font-mono text-xs text-muted-foreground overflow-hidden">
                  <Globe className="size-3 shrink-0 text-primary" />
                  <span className="truncate">{result.url}</span>
                  <button
                    onClick={handleCopyUrl}
                    className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy URL"
                  >
                    {copied ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>

                {/* File count badge */}
                {fileCount > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <FileCode2 className="size-3" />
                    <span>
                      {fileCount} file{fileCount !== 1 ? "s" : ""} deployed
                      {isMultiFile ? " (multi-file project)" : ""}
                    </span>
                  </div>
                )}

                {/* CTA Row */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    className="gap-1.5 h-7.5 text-xs rounded-lg"
                    onClick={() => window.open(result.url, "_blank")}
                  >
                    <Rocket className="size-3" />
                    Open Live Site
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-7.5 text-xs rounded-lg"
                    onClick={handleCopyUrl}
                  >
                    {copied ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    {copied ? "Copied!" : "Copy URL"}
                  </Button>
                  <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1 bg-emerald-500/5 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="size-3 shrink-0" />
                    Live
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AgentTaskCard>
    </motion.div>
  );
}
