"use client";

import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "ui/tooltip";

interface UploadLimitBadgeProps {
  children: React.ReactNode;
  className?: string;
}

interface UploadLimitInfo {
  remaining: number;
  limit: number;
  resetTime: string;
}

export function UploadLimitBadge({
  children,
  className,
}: UploadLimitBadgeProps) {
  const [uploadLimit, setUploadLimit] = useState<UploadLimitInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUploadLimit = async () => {
      try {
        const response = await fetch("/api/storage/upload-limit");
        if (response.ok) {
          const data = await response.json();
          setUploadLimit(data);
        }
      } catch (error) {
        console.error("Failed to fetch upload limit:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUploadLimit();
    // Refresh every minute
    const interval = setInterval(fetchUploadLimit, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !uploadLimit) {
    return <>{children}</>;
  }

  const isLimitReached = uploadLimit.remaining === 0;
  const resetDate = new Date(uploadLimit.resetTime);
  const resetTime = resetDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={className}>
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-2">
          <div className="font-semibold">
            {uploadLimit.remaining} of {uploadLimit.limit} uploads remaining
          </div>
          <div className="text-xs text-muted-foreground">
            Daily limit resets at {resetTime}
          </div>
          {isLimitReached && (
            <div className="text-xs pt-2 border-t border-border">
              <a
                href="/upgrade"
                className="text-blue-400 hover:underline font-medium"
              >
                Upgrade for more uploads
              </a>
            </div>
          )}
          {uploadLimit.remaining <= 2 && !isLimitReached && (
            <div className="text-xs pt-2 border-t border-border">
              <a
                href="/upgrade"
                className="text-blue-400 hover:underline font-medium"
              >
                Upgrade for unlimited uploads
              </a>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
