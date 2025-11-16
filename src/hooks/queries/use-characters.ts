"use client";
import { appStore } from "@/app/store";
import useSWR, { SWRConfiguration } from "swr";
import { handleErrorWithToast } from "ui/shared-toast";
import { fetcher } from "lib/utils";
import { CharacterSummary } from "@/app/store";

interface UseCharactersOptions extends SWRConfiguration {
  type?: "all" | "private" | "public";
}

export function useCharacters(options: UseCharactersOptions = {}) {
  const { type = "private", ...swrOptions } = options;

  // Build query string
  const queryParams = new URLSearchParams({
    type,
  });

  console.log(`[useCharacters] Fetching characters with type: ${type}`);

  const {
    data: characters = [],
    error,
    isLoading,
    mutate,
  } = useSWR<CharacterSummary[]>(
    `/api/character?${queryParams.toString()}`,
    fetcher,
    {
      errorRetryCount: 0,
      revalidateOnFocus: false,
      fallbackData: [],
      onError: (err) => {
        console.error(`[useCharacters] Error fetching characters:`, err);
        handleErrorWithToast(err);
      },
      onSuccess: (data) => {
        console.log(`[useCharacters] Successfully fetched ${data.length} characters`);
        // Update Zustand store for chat mentions
        appStore.setState({ characterList: data });
      },
      ...swrOptions,
    },
  );

  return {
    characters,
    isLoading,
    error,
    mutate,
  };
}
