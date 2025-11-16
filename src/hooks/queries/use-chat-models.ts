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
      }[];
    }[]
  >("/api/chat/models", fetcher, {
    dedupingInterval: 60_000 * 5,
    revalidateOnFocus: false,
    fallbackData: [],
    onSuccess: (data) => {
      const status = appStore.getState();
      if (!status.chatModel) {
        // Set default model to ChatGPT GPT-5 Nano (Pollinations)
        let defaultProvider = data[0].provider;
        let defaultModel = data[0].models[0].name;
        
        // Look for OpenAI provider and GPT-5 Nano model
        const openaiProvider = data.find((p) => p.provider === "OpenAI");
        if (openaiProvider) {
          const gpt5NanoModel = openaiProvider.models.find(
            (m) => m.name === "ChatGPT GPT-5 Nano"
          );
          if (gpt5NanoModel) {
            defaultProvider = openaiProvider.provider;
            defaultModel = gpt5NanoModel.name;
          }
        }
        
        appStore.setState({ chatModel: { provider: defaultProvider, model: defaultModel } });
      }
    },
    ...options,
  });
};
