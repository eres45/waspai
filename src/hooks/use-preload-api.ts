import { useEffect, useRef } from "react";

/**
 * Pre-loads API routes to avoid compilation delay on first use
 * This hook makes dummy requests to API endpoints to trigger compilation
 * so they're ready when the user actually needs them
 * 
 * IMPORTANT: Only runs ONCE on app startup, not on every page refresh
 */
export function usePreloadApi() {
  const hasPreloadedRef = useRef(false);

  useEffect(() => {
    // Skip if already preloaded in this session
    if (hasPreloadedRef.current) {
      return;
    }

    // Mark as preloaded to prevent duplicate requests
    hasPreloadedRef.current = true;

    // Pre-load chat API
    const preloadChatApi = async () => {
      try {
        // Make a dummy HEAD request to trigger route compilation
        // This won't actually send a message, just loads the route
        await fetch("/api/chat", {
          method: "HEAD",
          headers: {
            "Content-Type": "application/json",
          },
        }).catch(() => {
          // Ignore errors - we're just pre-loading
        });
      } catch (error) {
        // Silently fail - this is just optimization
      }
    };

    // Pre-load other important APIs
    const preloadApis = async () => {
      try {
        await Promise.all([
          fetch("/api/thread", { method: "HEAD" }).catch(() => {}),
          fetch("/api/chat/models", { method: "HEAD" }).catch(() => {}),
          fetch("/api/storage/upload-limit", { method: "HEAD" }).catch(() => {}),
        ]);
      } catch (error) {
        // Silently fail
      }
    };

    // Run preload after a short delay to not block initial page load
    const timer = setTimeout(() => {
      preloadChatApi();
      preloadApis();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
}
