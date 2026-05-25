"use client";

import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "lib/utils";
import type { SkillSummary, SkillCategory, SkillTier } from "@/types/skill";

interface UseSkillsOptions {
  category?: SkillCategory;
  search?: string;
  featured?: boolean;
  tierRequired?: SkillTier;
  limit?: number;
}

export function useSkills(options: UseSkillsOptions = {}) {
  const { category, search, featured, tierRequired, limit = 50 } = options;

  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (search) params.set("search", search);
  if (featured !== undefined) params.set("featured", String(featured));
  if (tierRequired) params.set("tierRequired", tierRequired);
  params.set("limit", String(limit));

  const key = `/api/skills?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<SkillSummary[]>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      fallbackData: [],
    },
  );

  return {
    skills: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useSkill(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/skills/${id}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { skill: data, isLoading, error, mutate };
}

export function useMutateSkills() {
  const { mutate } = useSWRConfig();

  return (
    updatedSkill?: Partial<SkillSummary> & { id: string },
    deleteSkill?: boolean,
  ) => {
    mutate(
      (key) =>
        typeof key === "string" &&
        key.startsWith("/api/skills") &&
        !key.includes("/install") &&
        !key.includes("/rate"),
      (cachedData: SkillSummary[] | undefined) => {
        if (!cachedData || !Array.isArray(cachedData) || !updatedSkill)
          return cachedData;
        if (deleteSkill)
          return cachedData.filter((s) => s.id !== updatedSkill.id);
        const idx = cachedData.findIndex((s) => s.id === updatedSkill.id);
        if (idx >= 0) {
          const next = [...cachedData];
          next[idx] = { ...next[idx], ...updatedSkill };
          return next;
        }
        return [updatedSkill as SkillSummary, ...cachedData];
      },
      { revalidate: true },
    );
  };
}
