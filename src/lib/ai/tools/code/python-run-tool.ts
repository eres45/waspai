import { JSONSchema7 } from "json-schema";
import { tool as createTool } from "ai";
import { jsonSchemaToZod } from "lib/json-schema-to-zod";

export const pythonExecutionSchema: JSONSchema7 = {
  type: "object",
  properties: {
    code: {
      type: "string",
      description: `Execute Python code in an isolated execution sandbox with full internet access and disk storage.\n\nKey capabilities:\n- Web & APIs: httpx, requests, beautifulsoup4 (scrape any URL, download web images with follow_redirects=True).\n- Document & Media Generation: reportlab (build multi-page PDFs, albums), pillow/PIL (crop, resize, format images), openpyxl/pandas (Excel spreadsheets & CSVs), matplotlib (charts/graphs).\n- Automatic File Harvesting: ANY file saved to disk (e.g. output.pdf, album.pdf, data.xlsx, chart.png) is automatically harvested and displayed as an interactive download card in the chat UI.\n\nTips:\n- When creating image albums or multi-page PDFs: use reportlab.pdfgen.canvas or SimpleDocTemplate, download images using httpx.get(url, follow_redirects=True), and insert them onto each page.\n- Print helpful progress logs using print().`,
    },
    script: {
      type: "string",
      description: "Alternative parameter name for the Python code to execute.",
    },
    command: {
      type: "string",
      description:
        "Alternative parameter name for the Python code or command to execute.",
    },
  },
};

export const pythonExecutionTool = createTool({
  description:
    "Execute Python code in a powerful cloud sandbox with full internet access. Supports bulk image downloads, web scraping, data science (pandas, numpy, matplotlib), image processing (pillow), and document creation (reportlab for multi-page PDFs, openpyxl for Excel). Any files saved to the filesystem are automatically presented to the user as direct download cards.",
  inputSchema: jsonSchemaToZod(pythonExecutionSchema),
});
