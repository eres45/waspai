"use client";

import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "lib/utils";
import type { UserSkill, Skill } from "@/types/skill";

export function useInstalledSkills() {
  const { data, error, isLoading, mutate } = useSWR<
    (UserSkill & { skill: Skill })[]
  >("/api/skills/installed", fetcher, {
    revalidateOnFocus: false,
    fallbackData: [],
  });

  return {
    installedSkills: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useMutateInstalledSkills() {
  const { mutate } = useSWRConfig();
  return () => {
    mutate("/api/skills/installed");
  };
}
