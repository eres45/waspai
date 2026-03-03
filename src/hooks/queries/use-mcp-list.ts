"use client";
import { appStore } from "@/app/store";
import useSWR, { SWRConfiguration } from "swr";
import { handleErrorWithToast } from "ui/shared-toast";
import { fetcher, objectFlow } from "lib/utils";
import { MCPServerInfo } from "app-types/mcp";

export function useMcpList(options?: SWRConfiguration) {
  return useSWR<MCPServerInfo[]>("/api/mcp/list", fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 0,
    focusThrottleInterval: 1000 * 60 * 5,
    fallbackData: [],
    onError: handleErrorWithToast,
    onSuccess: (data) => {
      const ids = data.map((v) => v.id);
      appStore.setState((prev) => {
        const nextAllowedMcpServers = { ...(prev.allowedMcpServers || {}) };

        for (const server of data) {
          if (
            server.visibility === "public" &&
            !nextAllowedMcpServers[server.id]
          ) {
            nextAllowedMcpServers[server.id] = {
              tools: server.toolInfo.map((t) => t.name),
            };
          }
        }

        const filteredAllowedMcpServers = objectFlow(
          nextAllowedMcpServers,
        ).filter((_, key) => ids.includes(String(key)));

        return {
          mcpList: data,
          allowedMcpServers: filteredAllowedMcpServers,
        };
      });
    },
    ...options,
  });
}
