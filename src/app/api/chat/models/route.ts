import { customModelProvider } from "lib/ai/models";
import {
  PROVIDER_ORDER,
  PROVIDER_DISPLAY_NAMES,
  MODEL_DISPLAY_NAMES,
} from "lib/ai/model-display-names";

export const GET = async () => {
  return Response.json(
    customModelProvider.modelsInfo
      .map((provider) => ({
        ...provider,
        provider:
          PROVIDER_DISPLAY_NAMES[provider.provider] || provider.provider,
        models: provider.models.map((model) => ({
          ...model,
          name: MODEL_DISPLAY_NAMES[model.name] || model.name,
        })),
      }))
      .sort((a, b) => {
        // First sort by provider order
        const aIndex = PROVIDER_ORDER.indexOf(a.provider);
        const bIndex = PROVIDER_ORDER.indexOf(b.provider);
        const aOrder = aIndex === -1 ? PROVIDER_ORDER.length : aIndex;
        const bOrder = bIndex === -1 ? PROVIDER_ORDER.length : bIndex;

        if (aOrder !== bOrder) return aOrder - bOrder;

        // Then sort by API key availability
        if (a.hasAPIKey && !b.hasAPIKey) return -1;
        if (!a.hasAPIKey && b.hasAPIKey) return 1;
        return 0;
      }),
  );
};
