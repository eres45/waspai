"use client";

import React from "react";
import { cn } from "lib/utils";

interface AgentTimelineProps {
  className?: string;
  children: React.ReactNode;
}

export function AgentTimeline({ className, children }: AgentTimelineProps) {
  return (
    <div className={cn("relative flex flex-col gap-5 pl-2.5", className)}>
      {/* Visual left timeline connector line */}
      <div className="absolute left-[15px] top-3 bottom-3 w-[1.5px] bg-gradient-to-b from-primary/30 via-border/50 to-muted/20" />
      {children}
    </div>
  );
}
