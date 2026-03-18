import { tool as createTool } from "ai";
import { z } from "zod";

export const createTableTool = createTool({
  description:
    "Create an interactive table with data. The table will automatically have sorting, filtering, and search functionality.",
  inputSchema: z.object({
    title: z.string().describe("Table title"),
    description: z.string().nullable().describe("Optional table description"),
    columns: z
      .array(
        z.object({
          key: z
            .string()
            .describe(
              "Unique key for the column. This MUST match the property keys in the data objects.",
            ),
          label: z.string().describe("Display label for the column header"),
          type: z
            .enum(["string", "number", "date", "boolean"])
            .nullable()
            .default("string")
            .describe(
              "Data type: 'number' for stats, 'date' for timestamps, 'boolean' for status, 'string' for text",
            ),
        }),
      )
      .describe("Column configuration defining keys and labels"),
    data: z
      .array(z.record(z.string(), z.any()))
      .describe(
        "Array of row objects. IMPORTANT: Each object property name (key) MUST exactly match one of the 'key' values defined in the columns array.",
      ),
  }),
  execute: async () => {
    return "Success";
  },
});
