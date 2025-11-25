"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseAuth } from "@/lib/auth/supabase-auth";
import logger from "@/lib/logger";

/**
 * Client-side component to handle OAuth callback
 * Processes the token from URL hash and sets up session
 */
export function AuthCallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash from URL
        const hash = window.location.hash.substring(1);

        if (!hash) {
          logger.info("No hash in URL, redirecting to home");
          router.push("/");
          return;
        }

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

        // Set the session in Supabase
        const { data, error } = await supabaseAuth.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (error) {
          logger.error("Failed to set session:", error);
          router.push(
            `/auth/error?error=session_error&description=${error.message}`,
          );
          return;
        }

        if (data?.user) {
          logger.info(`User authenticated: ${data.user.email}`);
          // Clear the hash from URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
          // Redirect to home
          router.push("/");
        }
      } catch (error) {
        logger.error("Auth callback handler error:", error);
        router.push("/auth/error?error=callback_error");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
