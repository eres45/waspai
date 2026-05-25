"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plus, Sparkles, FolderHeart } from "lucide-react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { SkillCard, SkillCardSkeleton } from "./skill-card";
import { SkillTierGate } from "./skill-tier-gate";
import type { SkillSummary, SkillCategory, SkillTier } from "@/types/skill";
import { fetcher } from "lib/utils";
import { cn } from "lib/utils";
import { Button } from "ui/button";
import { Input } from "ui/input";

const CATEGORIES: {
  value: SkillCategory | "all";
  label: string;
  emoji: string;
}[] = [
  { value: "all", label: "All", emoji: "✨" },
  { value: "productivity", label: "Productivity", emoji: "⚡" },
  { value: "coding", label: "Coding", emoji: "💻" },
  { value: "media", label: "Media", emoji: "🎨" },
  { value: "writing", label: "Writing", emoji: "✍️" },
  { value: "research", label: "Research", emoji: "🔍" },
  { value: "automation", label: "Automation", emoji: "🤖" },
];

const TIERS: { value: SkillTier | "all"; label: string }[] = [
  { value: "all", label: "All Tiers" },
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "max", label: "Max" },
];

interface SkillLibraryProps {
  userId: string;
}

export function SkillLibrary({ userId: _userId }: SkillLibraryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate } = useSWRConfig();

  const [activeTab, setActiveTab] = useState<"explore" | "mine">("explore");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<SkillCategory | "all">("all");
  const [tier, setTier] = useState<SkillTier | "all">("all");
  const [tierGate, setTierGate] = useState<{
    skill: SkillSummary;
    requiredTier: SkillTier;
  } | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "mine") {
      setActiveTab("mine");
    } else {
      setActiveTab("explore");
    }
  }, [searchParams]);

  const handleTabChange = (tab: "explore" | "mine") => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === "mine") {
      params.set("tab", "mine");
    } else {
      params.delete("tab");
    }
    router.replace(`/skills?${params.toString()}`);
  };

  const buildKey = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    return `/api/skills?${p.toString()}`;
  };

  // Featured skills
  const { data: featuredSkills = [], isLoading: featuredLoading } = useSWR<
    SkillSummary[]
  >(buildKey({ featured: "true", limit: "8" }), fetcher, {
    revalidateOnFocus: false,
  });

  // All / filtered skills
  const filterKey = buildKey({
    category: category !== "all" ? category : undefined,
    search: debouncedSearch || undefined,
    tierRequired: tier !== "all" ? tier : undefined,
    limit: "60",
  });
  const { data: skills = [], isLoading } = useSWR<SkillSummary[]>(
    filterKey,
    fetcher,
    {
      revalidateOnFocus: false,
      fallbackData: [],
    },
  );

  // Installed / my skills
  const { data: installedItems = [], isLoading: installedLoading } = useSWR<
    {
      id: string;
      userId: string;
      skillId: string;
      isActive: boolean;
      installedAt: string;
      skill: SkillSummary;
    }[]
  >("/api/skills/installed", fetcher, {
    revalidateOnFocus: false,
  });

  const mySkills = (installedItems || [])
    .map((item) => item.skill)
    .filter(Boolean)
    .map((s) => ({
      ...s,
      isInstalled: true,
    })) as SkillSummary[];

  const filteredMySkills = mySkills.filter((s) => {
    if (!search) return true;
    const sTerm = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(sTerm) ||
      s.description.toLowerCase().includes(sTerm) ||
      s.name.toLowerCase().includes(sTerm)
    );
  });

  const revalidate = useCallback(() => {
    mutate((key) => typeof key === "string" && key.startsWith("/api/skills"));
  }, [mutate]);

  const handleInstall = useCallback(
    async (skill: SkillSummary) => {
      try {
        const res = await fetch(`/api/skills/${skill.id}/install`, {
          method: "POST",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (body.error === "tier_required") {
            setTierGate({
              skill,
              requiredTier: body.tierRequired as SkillTier,
            });
            return;
          }
          throw new Error(body.error || "Failed to install");
        }
        toast.success(
          `✅ "${skill.title}" installed! It's now active in your chats.`,
        );
        revalidate();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to install skill");
      }
    },
    [revalidate],
  );

  const handleUninstall = useCallback(
    async (skill: SkillSummary) => {
      try {
        const res = await fetch(`/api/skills/${skill.id}/install`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to uninstall");
        toast.success(`"${skill.title}" uninstalled.`);
        revalidate();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to uninstall skill",
        );
      }
    },
    [revalidate],
  );

  const goToDetail = (id: string) => router.push(`/skills/${id}`);

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-accent/30 to-background px-6 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-5 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Skill Library
                </span>
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Supercharge your AI
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm max-w-lg">
                Install skills to give your AI specialized expertise. Each skill
                teaches it exactly what to do for specific tasks.
              </p>
            </div>
            <Button
              onClick={() => router.push("/skills/create")}
              className="gap-2 shrink-0"
            >
              <Plus className="size-4" />
              Create Skill
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-border/50 gap-6">
          <button
            onClick={() => handleTabChange("explore")}
            className={cn(
              "pb-3.5 text-sm font-semibold border-b-2 transition-all relative flex items-center gap-2",
              activeTab === "explore"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Sparkles className="size-4" />
            Explore Library
          </button>
          <button
            onClick={() => handleTabChange("mine")}
            className={cn(
              "pb-3.5 text-sm font-semibold border-b-2 transition-all relative flex items-center gap-2",
              activeTab === "mine"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <FolderHeart className="size-4" />
            My Skills
            {mySkills.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                {mySkills.length}
              </span>
            )}
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={
                activeTab === "explore"
                  ? "Search skills…"
                  : "Search installed skills…"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-accent/30 border-border/50 focus:border-border"
            />
          </div>

          {activeTab === "explore" && (
            <>
              {/* Category tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() =>
                      setCategory(cat.value as SkillCategory | "all")
                    }
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all border",
                      category === cat.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/50",
                    )}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Tier filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">
                  Tier:
                </span>
                {TIERS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTier(t.value as SkillTier | "all")}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-all border",
                      tier === t.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/50",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {activeTab === "explore" ? (
          <>
            {/* Featured Row (shown only when not actively filtering) */}
            {!debouncedSearch && category === "all" && tier === "all" && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <span>⭐</span> Featured Skills
                  </h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
                  {featuredLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="shrink-0 w-64">
                          <SkillCardSkeleton />
                        </div>
                      ))
                    : featuredSkills.map((skill) => (
                        <div key={skill.id} className="shrink-0 w-64">
                          <SkillCard
                            skill={skill}
                            onInstall={handleInstall}
                            onUninstall={handleUninstall}
                            onClick={() => goToDetail(skill.id)}
                          />
                        </div>
                      ))}
                </div>
              </section>
            )}

            {/* Main Grid */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">
                  {!debouncedSearch && category === "all" && tier === "all"
                    ? "All Skills"
                    : `Results ${isLoading ? "" : `(${skills.length})`}`}
                </h2>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <SkillCardSkeleton key={i} />
                  ))}
                </div>
              ) : skills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="font-medium text-foreground">No skills found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {debouncedSearch
                      ? `No skills match "${debouncedSearch}"`
                      : "No skills in this category yet"}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/skills/create")}
                  >
                    <Plus className="size-4 mr-2" />
                    Create a skill
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skills.map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      onInstall={handleInstall}
                      onUninstall={handleUninstall}
                      onClick={() => goToDetail(skill.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          /* My Skills Tab */
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                {search
                  ? `Results (${filteredMySkills.length})`
                  : "My Active Skills"}
              </h2>
            </div>

            {installedLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkillCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredMySkills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
                <div className="flex items-center justify-center size-16 rounded-full bg-accent/30 text-2xl mb-4">
                  {search ? "🔍" : "✨"}
                </div>
                <p className="font-semibold text-lg text-foreground">
                  {search
                    ? "No installed skills found"
                    : "Your Skill Library is empty"}
                </p>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {search
                    ? `No installed skills match "${search}"`
                    : "Install skills from the library or create your own custom AI skill. Active skills are instantly used by the AI to help you."}
                </p>
                {!search ? (
                  <div className="flex gap-3 mt-6">
                    <Button onClick={() => handleTabChange("explore")}>
                      <Sparkles className="size-4 mr-2" />
                      Browse Library
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/skills/create")}
                    >
                      <Plus className="size-4 mr-2" />
                      Create Custom Skill
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMySkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onInstall={handleInstall}
                    onUninstall={handleUninstall}
                    onClick={() => goToDetail(skill.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Tier Gate Dialog */}
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
