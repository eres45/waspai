import { tool as createTool } from "ai";
import { z } from "zod";

export const createTableTool = createTool({
  description:
    "Create an interactive table with data. The table will automatically have sorting, filtering, and search functionality.",
  inputSchema: z.object({
    title: z.string().min(1).describe("The mandatory title of the table."),
    description: z
      .string()
      .nullable()
      .optional()
      .describe("An optional description for the table content."),
    columns: z
      .array(
        z.object({
          key: z
            .string()
            .min(1)
            .describe(
              "Unique identifier for the column. MUST exactly match keys in the data objects.",
            ),
          label: z.string().min(1).describe("Display name for the column header."),
          type: z
            .enum(["string", "number", "date", "boolean"])
            .optional()
            .default("string")
            .describe("Data type: string, number, date, or boolean."),
        }),
      )
      .min(1)
      .describe("Array of column definitions. At least one column is required."),
    data: z
      .array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])))
      .min(2, "At least 2 data rows are required to create a table.")
      .describe(
        "Array of row data objects. Each object must contain keys matching the column definitions. MINIMUM 2 ROWS.",
      ),
  }),
  execute: async () => {
    return "Success";
  },
});
