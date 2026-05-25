"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Check,
  Star,
  Package,
  FileText,
  MessageSquare,
  Wrench,
  Lock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Skill, SkillRating, SkillTier } from "@/types/skill";
import { SkillTierGate } from "./skill-tier-gate";
import { Button } from "ui/button";
import { cn } from "lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  productivity: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  coding: "bg-green-500/15 text-green-400 border-green-500/20",
  media: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  writing: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  research: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  automation: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  other: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

interface SkillDetailProps {
  skill: Skill;
  ratings: SkillRating[];
  userId: string;
  userRating?: SkillRating | null;
}

type Tab = "overview" | "content" | "reviews";

export function SkillDetail({
  skill,
  ratings,
  userId,
  userRating: initialUserRating,
}: SkillDetailProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [installing, setInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(skill.isInstalled ?? false);
  const [tierGate, setTierGate] = useState<{
    skill: Skill;
    requiredTier: SkillTier;
  } | null>(null);
  const [userRating, setUserRating] = useState(initialUserRating?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState(initialUserRating?.review ?? "");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [allRatings, setAllRatings] = useState(ratings);

  const avgRating =
    allRatings.length > 0
      ? allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length
      : 0;

  const handleInstall = useCallback(async () => {
    setInstalling(true);
    try {
      const res = await fetch(`/api/skills/${skill.id}/install`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === "tier_required") {
          setTierGate({ skill, requiredTier: body.tierRequired as SkillTier });
          return;
        }
        throw new Error(body.error || "Failed to install");
      }
      setIsInstalled(true);
      toast.success(`✅ "${skill.title}" installed!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to install skill");
    } finally {
      setInstalling(false);
    }
  }, [skill]);

  const handleUninstall = useCallback(async () => {
    setInstalling(true);
    try {
      const res = await fetch(`/api/skills/${skill.id}/install`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to uninstall");
      setIsInstalled(false);
      toast.success(`"${skill.title}" uninstalled.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to uninstall skill");
    } finally {
      setInstalling(false);
    }
  }, [skill]);

  const handleRatingSubmit = useCallback(async () => {
    if (userRating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/skills/${skill.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: userRating,
          review: review || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit rating");
      const newRating: SkillRating = await res.json();
      setAllRatings((prev) => {
        const idx = prev.findIndex((r) => r.userId === userId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...newRating, authorName: "You" };
          return next;
        }
        return [{ ...newRating, authorName: "You" }, ...prev];
      });
      toast.success("Rating submitted!");
    } catch (_e) {
      toast.error("Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  }, [skill.id, userId, userRating, review]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <Package className="size-3.5" />,
    },
    {
      id: "content",
      label: "SKILL.md",
      icon: <FileText className="size-3.5" />,
    },
    {
      id: "reviews",
      label: `Reviews (${allRatings.length})`,
      icon: <MessageSquare className="size-3.5" />,
    },
  ];

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Header */}
      <div className="border-b border-border/50 px-6 py-6 bg-gradient-to-b from-accent/20 to-background">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 mb-4 -ml-2 text-muted-foreground"
            onClick={() => router.push("/skills")}
          >
            <ArrowLeft className="size-4" />
            Skill Library
          </Button>

          <div className="flex items-start gap-5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-accent/60 text-3xl border border-border/50 shadow-sm">
              {skill.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">
                  {skill.title}
                </h1>
                {skill.isVerified && (
                  <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {skill.description}
              </p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-md border capitalize",
                    CATEGORY_COLORS[skill.category],
                  )}
                >
                  {skill.category}
                </span>
                {skill.tierRequired !== "free" && (
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-md border uppercase font-semibold",
                      skill.tierRequired === "pro"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/15 text-rose-400 border-rose-500/20",
                    )}
                  >
                    {skill.tierRequired}
                  </span>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Download className="size-3" />
                  {skill.installCount.toLocaleString()} installs
                </span>
                {avgRating > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {avgRating.toFixed(1)} ({allRatings.length})
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  by {skill.authorName ?? "Unknown"}
                </span>
              </div>
            </div>

            <Button
              className={cn(
                "shrink-0 gap-2",
                isInstalled &&
                  "bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30",
              )}
              variant={isInstalled ? "outline" : "default"}
              onClick={isInstalled ? handleUninstall : handleInstall}
              disabled={installing}
            >
              {installing ? (
                <div className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : isInstalled ? (
                <>
                  <Check className="size-4" />
                  Installed
                </>
              ) : skill.tierRequired !== "free" ? (
                <>
                  <Lock className="size-4" />
                  Install
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  Install
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/50 bg-background/80 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all",
                  tab === t.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto w-full px-6 py-8">
        {tab === "overview" && (
          <div className="flex flex-col gap-6">
            {skill.toolsRequired && skill.toolsRequired.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-accent/10 p-5">
                <h2 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <Wrench className="size-4" />
                  Required Tools
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skill.toolsRequired.map((tool) => (
                    <span
                      key={tool}
                      className="text-xs px-2.5 py-1 rounded-md bg-accent border border-border/50 text-foreground font-mono"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border/60 bg-accent/10 p-5">
              <h2 className="font-semibold text-sm text-foreground mb-3">
                Details
              </h2>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs">Version</dt>
                  <dd className="text-foreground font-medium">
                    {skill.version}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Tier</dt>
                  <dd className="text-foreground font-medium capitalize">
                    {skill.tierRequired}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Category</dt>
                  <dd className="text-foreground font-medium capitalize">
                    {skill.category}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Author</dt>
                  <dd className="text-foreground font-medium">
                    {skill.authorName ?? "Unknown"}
                  </dd>
                </div>
              </dl>
            </div>

            {skill.tags && skill.tags.length > 0 && (
              <div>
                <h2 className="font-semibold text-sm text-foreground mb-2">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {skill.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-md bg-accent/60 border border-border/40 text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "content" && (
          <div className="rounded-xl border border-border/60 bg-accent/5 p-6">
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{skill.content}</ReactMarkdown>
            </div>
          </div>
        )}

        {tab === "reviews" && (
          <div className="flex flex-col gap-6">
            {/* Rating widget */}
            <div className="rounded-xl border border-border/60 bg-accent/10 p-5">
              <h2 className="font-semibold text-sm text-foreground mb-4">
                Rate this skill
              </h2>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(star)}
                    className="text-2xl transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "size-6 transition-colors",
                        (hoverRating || userRating) >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground",
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {userRating > 0 ? `${userRating}/5` : "Select rating"}
                </span>
              </div>
              <textarea
                className="w-full rounded-lg bg-accent/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                rows={3}
                placeholder="Write a review (optional)…"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
              <Button
                className="mt-2"
                size="sm"
                onClick={handleRatingSubmit}
                disabled={submittingRating || userRating === 0}
              >
                {submittingRating ? "Submitting…" : "Submit Review"}
              </Button>
            </div>

            {/* Reviews list */}
            {allRatings.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No reviews yet. Be the first to review!
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {allRatings.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "size-3.5",
                              r.rating >= star
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground",
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {r.authorName ?? "Anonymous"}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {r.review && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {r.review}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tier Gate */}
      {tierGate && (
        <SkillTierGate
          skill={tierGate.skill}
          requiredTier={tierGate.requiredTier}
          open={!!tierGate}
          onClose={() => setTierGate(null)}
        />
      )}
    </div>
  );
}
