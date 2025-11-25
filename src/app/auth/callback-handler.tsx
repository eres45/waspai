"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import logger from "@/lib/logger";

/**
 * Client-side component to handle OAuth callback
 * Only processes token if it exists in URL hash
 */
export function AuthCallbackHandler() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash from URL
        const hash = window.location.hash.substring(1);

        // Only process if there's a hash with access_token
        if (!hash || !hash.includes("access_token")) {
          return;
        }

        setIsProcessing(true);

        // Parse the hash parameters
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (!accessToken) {
          logger.error("No access token in URL hash");
          router.push("/auth/error?error=no_token");
          return;
        }

        logger.info("Processing OAuth callback with access token");

        // Call server action to set session and create user
        const response = await fetch("/api/auth/callback-handler", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken,
            refreshToken,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          logger.error("Failed to process callback:", result.error);
          router.push(
            `/auth/error?error=session_error&description=${result.error}`,
          );
          return;
        }

        logger.info(`User authenticated: ${result.email}`);
        // Clear the hash from URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
        // Redirect to home
        router.push("/");
      } catch (error) {
        logger.error("Auth callback handler error:", error);
        router.push("/auth/error?error=callback_error");
      }
    };

    handleCallback();
  }, [router]);

  if (!isProcessing) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
