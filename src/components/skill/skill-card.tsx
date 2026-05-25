"use client";

import { useState } from "react";
import { Download, Check, Lock, Star } from "lucide-react";
import { cn } from "lib/utils";
import type { SkillSummary } from "@/types/skill";
import { Button } from "ui/button";
import { Skeleton } from "ui/skeleton";

const CATEGORY_COLORS: Record<string, string> = {
  productivity: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  coding: "bg-green-500/15 text-green-400 border-green-500/20",
  media: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  writing: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  research: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  automation: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  other: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

const TIER_COLORS: Record<string, string> = {
  free: "",
  pro: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  max: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

interface SkillCardProps {
  skill: SkillSummary;
  onInstall: (skill: SkillSummary) => Promise<void>;
  onUninstall: (skill: SkillSummary) => Promise<void>;
  onClick?: () => void;
}

export function SkillCard({
  skill,
  onInstall,
  onUninstall,
  onClick,
}: SkillCardProps) {
  const [loading, setLoading] = useState(false);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (skill.isInstalled) {
        await onUninstall(skill);
      } else {
        await onInstall(skill);
      }
    } finally {
      setLoading(false);
    }
  };

  const avgRating = skill.averageRating ?? 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 cursor-pointer",
        "hover:border-border hover:bg-card/80 hover:shadow-md transition-all duration-200",
        skill.isInstalled && "border-primary/30 bg-primary/5",
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/50 text-xl border border-border/40">
          {skill.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {skill.title}
            </h3>
            {skill.isVerified && (
              <span className="text-xs text-blue-400">✓</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded-md border capitalize",
                CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.other,
              )}
            >
              {skill.category}
            </span>
            {skill.tierRequired !== "free" && (
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-md border uppercase font-semibold",
                  TIER_COLORS[skill.tierRequired],
                )}
              >
                {skill.tierRequired}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {skill.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Download className="size-3" />
            {skill.installCount.toLocaleString()}
          </span>
          {avgRating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {avgRating.toFixed(1)}
            </span>
          )}
        </div>

        <Button
          size="sm"
          variant={skill.isInstalled ? "secondary" : "default"}
          className={cn(
            "h-7 text-xs gap-1.5 transition-all",
            skill.isInstalled && "text-primary",
          )}
          onClick={handleInstallClick}
          disabled={loading}
        >
          {loading ? (
            <div className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : skill.isInstalled ? (
            <>
              <Check className="size-3" />
              Installed
            </>
          ) : skill.tierRequired !== "free" ? (
            <>
              <Lock className="size-3" />
              Install
            </>
          ) : (
            <>
              <Download className="size-3" />
              Install
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function SkillCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-8 w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-20" />
      </div>
    </div>
  );
}
