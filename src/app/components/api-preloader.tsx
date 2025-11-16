"use client";

import { usePreloadApi } from "@/hooks/use-preload-api";

/**
 * Client component that preloads API routes on app load
 * This ensures routes are compiled and ready when user needs them
 */
export function ApiPreloader() {
  usePreloadApi();
  return null;
}
