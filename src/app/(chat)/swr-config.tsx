"use client";

import { BasicUser } from "app-types/user";
import { useMemo, useEffect } from "react";
import { SWRConfig, SWRConfiguration } from "swr";

export function SWRConfigProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: BasicUser;
}) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");

    // Save original styles
    const originalHtmlOverflow = html.style.overflow;
    const originalBodyOverflow = body.style.overflow;
    const originalHtmlHeight = html.style.height;
    const originalBodyHeight = body.style.height;
    const originalRootHeight = root ? root.style.height : "";
    const originalRootWidth = root ? root.style.width : "";

    // Apply scroll locking styles to force the screen to be exactly 100% viewport size
    html.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.height = "100%";
    if (root) {
      root.style.height = "100%";
      root.style.width = "100%";
    }

    return () => {
      // Restore original styles
      html.style.overflow = originalHtmlOverflow;
      html.style.height = originalHtmlHeight;
      body.style.overflow = originalBodyOverflow;
      body.style.height = originalBodyHeight;
      if (root) {
        root.style.height = originalRootHeight;
        root.style.width = originalRootWidth;
      }
    };
  }, []);
  const config = useMemo<SWRConfiguration>(() => {
    return {
      focusThrottleInterval: 30000,
      dedupingInterval: 2000,
      errorRetryCount: 1,
      fallback: {
        "/api/user/details": user,
      },
    };
  }, [user]);

  return <SWRConfig value={config}>{children}</SWRConfig>;
}
