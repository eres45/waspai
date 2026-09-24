import { tool as createTool } from "ai";
import { z } from "zod";

export const createPieChartTool = createTool({
  description: "Create a pie chart",
  inputSchema: z.object({
    data: z
      .array(z.object({ label: z.string(), value: z.number() }))
      .min(2, "At least 2 data points are required to create a chart."),
    title: z.string(),
    description: z.string().nullable().optional(),
    unit: z.string().nullable().optional(),
  }),
  execute: async () => {
    return "Success";
  },
});
