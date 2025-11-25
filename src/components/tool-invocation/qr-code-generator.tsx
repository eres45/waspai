"use client";

import { ToolUIPart } from "ai";
import equal from "lib/equal";
import { Download, QrCode } from "lucide-react";
import { memo, useMemo, useCallback } from "react";
import { TextShimmer } from "ui/text-shimmer";
import { toast } from "sonner";

interface QRCodeGeneratorToolInvocationProps {
  part: ToolUIPart;
}

interface QRCodeResult {
  success: boolean;
  downloadUrl: string;
  filename: string;
  size: number;
  contentEncoded: string;
  qrSize: number;
  errorCorrectionLevel: string;
  guide?: string;
}

function PureQRCodeGeneratorToolInvocation({
  part,
}: QRCodeGeneratorToolInvocationProps) {
  const handleDownload = useCallback(
    async (qrUrl: string, filename: string) => {
      try {
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("QR code downloaded successfully");
      } catch (_error) {
        toast.error("Failed to download QR code");
      }
    },
    [],
  );

  const isGenerating = useMemo(() => {
    return !part.state.startsWith("output");
  }, [part.state]);

  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as QRCodeResult;
  }, [part.state, part.output]);

  const hasError = useMemo(() => {
    return (
      part.state === "output-error" ||
      (part.state === "output-available" && !result?.success)
    );
  }, [part.state, result]);

  if (isGenerating) {
    return (
      <div className="flex flex-col gap-4">
        <TextShimmer>Generating QR code...</TextShimmer>
        <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
          <QrCode className="size-12 text-muted-foreground animate-pulse" />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2 text-destructive">
          <QrCode className="size-4" />
          <span className="text-sm font-medium">QR code generation failed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        <div className="p-1.5 text-primary bg-input/40 rounded">
          <QrCode className="size-3.5" />
        </div>
        <span className="font-medium text-sm">QR code generated</span>
      </div>

      {result?.downloadUrl && (
        <div className="flex flex-col gap-3 w-full">
          {/* QR Code Preview */}
          <div className="relative group w-full rounded-lg overflow-hidden border border-border bg-card p-4 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.downloadUrl}
              alt="Generated QR code"
              className="w-64 h-64 object-contain"
              loading="lazy"
            />
            {/* Download button - top right corner */}
            <button
              onClick={() =>
                handleDownload(result.downloadUrl, result.filename)
              }
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
              title="Download QR code"
            >
              <Download className="size-4" />
            </button>
          </div>

          {/* QR Code Info */}
          <div className="flex flex-col gap-2 text-xs text-muted-foreground bg-card/50 p-3 rounded-lg border border-border/50">
            <div className="flex items-center justify-between">
              <span className="font-medium">Content:</span>
              <span className="truncate ml-2">
                {result.contentEncoded.substring(0, 40)}
                {result.contentEncoded.length > 40 ? "..." : ""}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Size:</span>
              <span>{result.qrSize}px</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Error Correction:</span>
              <span>{result.errorCorrectionLevel}</span>
            </div>
            {result.guide && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p>{result.guide}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const QRCodeGeneratorToolInvocation = memo(
  PureQRCodeGeneratorToolInvocation,
  (prev, next) => {
    if (prev.part.state !== next.part.state) return false;
    if (!equal(prev.part.output, next.part.output)) return false;
    return true;
  },
);

QRCodeGeneratorToolInvocation.displayName = "QRCodeGeneratorToolInvocation";
