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
    onSuccess: (_data) => {
      const status = appStore.getState();
      if (!status.chatModel || status.chatModel.model !== "gpt-oss-120b") {
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
