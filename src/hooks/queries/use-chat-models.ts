import { appStore } from "@/app/store";
import { fetcher } from "lib/utils";
import useSWR, { SWRConfiguration } from "swr";

export const useChatModels = (options?: SWRConfiguration) => {
  return useSWR<
    {
      provider: string;
      hasAPIKey: boolean;
      models: {
        name: string;
        isToolCallUnsupported: boolean;
        isImageInputUnsupported: boolean;
        supportedFileMimeTypes: string[];
        isPro?: boolean;
        tier?: string;
      }[];
    }[]
  >("/api/chat/models", fetcher, {
    dedupingInterval: 60_000 * 5,
    revalidateOnFocus: false,
    fallbackData: [],
    onSuccess: (data) => {
      const status = appStore.getState();
      const allModelNames = new Set(
        data.flatMap((p) => p.models.map((m) => m.name)),
      );
      if (!status.chatModel || !allModelNames.has(status.chatModel.model)) {
        appStore.setState({
          chatModel: {
            provider: "OpenAI",
            model: "gpt-oss-120b",
          },
        });
      }
    },
    ...options,
  });
};
