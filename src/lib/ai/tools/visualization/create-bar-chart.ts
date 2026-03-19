import { tool as createTool } from "ai";

import { z } from "zod";

export const createBarChartTool = createTool({
  description: "Create a bar chart with multiple data series",
  inputSchema: z.object({
    data: z
      .array(
        z.object({
          xAxisLabel: z.string(),
          series: z.array(
            z.object({
              seriesName: z.string(),
              value: z.number(),
            }),
          ),
        }),
      )
      .min(2, "At least 2 data points are required to create a chart.")
      .describe("Chart data with x-axis labels and series values. MINIMUM 2 DATA POINTS."),
    title: z.string(),
    description: z.string().nullable(),
    yAxisLabel: z.string().nullable().describe("Label for Y-axis"),
  }),
  execute: async () => {
    return "Success";
  },
});
