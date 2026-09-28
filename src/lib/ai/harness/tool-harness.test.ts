import { describe, expect, it, vi } from "vitest";
import {
  ALWAYS_ACTIVE_TOOLS,
  compactToolDefinition,
  createGatedHarnessedToolkit,
  extractPriorToolCallsFromMessages,
  selectActiveToolsForTurn,
} from "./tool-harness";

describe("Hermes 3 & DeepSeek Tool Harness Engine", () => {
  // Mock toolkit containing all standard tools + custom MCP tool
  const mockAllTools: Record<string, any> = {
    // Core Tools
    "web-search": {
      description:
        "Searches the web for up-to-date information, news, current facts, and stock prices. Call proactively whenever fresh data is required.",
      execute: vi.fn().mockResolvedValue("search results"),
    },
    web_search: {
      description: "Duplicate alias of web-search",
      execute: vi.fn().mockResolvedValue("search results"),
    },
    "image-manager": {
      description: "Generates high quality images using AI models.",
      execute: vi
        .fn()
        .mockResolvedValue({ url: "https://example.com/img.png" }),
    },
    createBarChart: {
      description: "Generates interactive bar charts.",
      execute: vi.fn(),
    },
    createLineChart: {
      description: "Generates interactive line charts.",
      execute: vi.fn(),
    },
    createPieChart: {
      description: "Generates interactive pie charts.",
      execute: vi.fn(),
    },
    createTable: {
      description: "Renders data as a responsive table.",
      execute: vi.fn(),
    },
    "python-execution": {
      description: "Executes Python code in a safe sandbox.",
      execute: vi.fn(),
    },
    "mini-javascript-execution": {
      description: "Executes JavaScript code in a sandbox.",
      execute: vi.fn(),
    },
    html_preview: {
      description:
        "Renders live interactive HTML widgets in an iframe preview.",
      execute: vi.fn(),
    },
    save_memory: {
      description: "Saves a new persistent memory fact about the user.",
      execute: vi.fn(),
    },
    get_memories: {
      description: "Retrieves memories matching a query.",
      execute: vi.fn(),
    },
    // Specialized Domain: Image Editing
    "remove-background": {
      description:
        "Removes the background from the provided image URL. Returns a transparent PNG with clean borders suitable for compositing.",
      execute: vi.fn(),
    },
    "enhance-image": {
      description: "Enhances lighting and sharpness of an image.",
      execute: vi.fn(),
    },
    // Specialized Domain: Documents
    "generate-pdf": {
      description:
        "Generates a multi-page PDF document with styling and header. Useful for professional reports and certificates.",
      execute: vi.fn(),
    },
    "convert-file": {
      description: "Converts uploaded files between formats.",
      execute: vi.fn(),
    },
    // Specialized Domain: QR Codes
    "generate-qr-code": {
      description: "Generates high quality QR code for a given URL or text.",
      execute: vi.fn(),
    },
    // Specialized Domain: Site & Code
    deploy_site: {
      description:
        "Deploys a multi-file interactive static website to preview hosting.",
      execute: vi.fn(),
    },
    write_site_file: {
      description: "Writes a file to the active site workspace.",
      execute: vi.fn(),
    },
    // Specialized Domain: SMS & Temp Mail
    "list-sms-numbers": {
      description:
        "Fetches available virtual phone numbers for SMS verification.",
      execute: vi.fn(),
    },
    // Specialized Domain: Web Scraping
    "steel-browser": {
      description:
        "Controls an automated headless browser to navigate and extract pages.",
      execute: vi.fn(),
    },
    // Custom MCP / Extension Tool
    mcp_spotify_play: {
      description: "Custom external MCP tool for playing Spotify audio tracks.",
      execute: vi.fn(),
    },
  };

  describe("Schema Minification (compactToolDefinition)", () => {
    it("compacts verbose descriptions to the first sentence", () => {
      const longTool = {
        description:
          "Searches the web for up-to-date information, news, current facts, and stock prices. Call proactively whenever fresh data is required. Supports complex queries and domain filtering.",
      };
      const compacted = compactToolDefinition(longTool);
      expect(compacted.description).toBe(
        "Searches the web for up-to-date information, news, current facts, and stock prices.",
      );
    });

    it("leaves short descriptions intact", () => {
      const shortTool = {
        description: "Generates interactive bar charts.",
      };
      const compacted = compactToolDefinition(shortTool);
      expect(compacted.description).toBe("Generates interactive bar charts.");
    });

    it("safely handles non-object or missing descriptions", () => {
      expect(compactToolDefinition(null)).toBeNull();
      expect(compactToolDefinition(undefined)).toBeUndefined();
      expect(compactToolDefinition({})).toEqual({});
    });
  });

  describe("Pre-Flight Context Gating (selectActiveToolsForTurn)", () => {
    it("always mounts all Core Tools on standard conversation turns", () => {
      const active = selectActiveToolsForTurn(mockAllTools, {
        userText: "Hello, what is the capital of France?",
      });

      for (const coreTool of ALWAYS_ACTIVE_TOOLS) {
        if (mockAllTools[coreTool]) {
          expect(active).toHaveProperty(coreTool);
        }
      }

      // Specialized tools should NOT be mounted
      expect(active).not.toHaveProperty("remove-background");
      expect(active).not.toHaveProperty("generate-pdf");
      expect(active).not.toHaveProperty("deploy_site");
      expect(active).not.toHaveProperty("list-sms-numbers");
    });

    it("mounts Image Edit tools when an image is present in context", () => {
      const active = selectActiveToolsForTurn(mockAllTools, {
        userText: "Can you change the background?",
        hasImages: true,
      });

      expect(active).toHaveProperty("remove-background");
      expect(active).toHaveProperty("enhance-image");
      // Other unrelated domains still gated out
      expect(active).not.toHaveProperty("deploy_site");
      expect(active).not.toHaveProperty("list-sms-numbers");
    });

    it("mounts Image Edit tools when keywords appear in query without attachments", () => {
      const active = selectActiveToolsForTurn(mockAllTools, {
        userText: "Can you upscale and enhance this photo?",
        hasImages: false,
      });

      expect(active).toHaveProperty("remove-background");
      expect(active).toHaveProperty("enhance-image");
    });

    it("mounts Document tools when files are attached", () => {
      const active = selectActiveToolsForTurn(mockAllTools, {
        userText: "Please extract this",
        hasFiles: true,
      });

      expect(active).toHaveProperty("generate-pdf");
      expect(active).toHaveProperty("convert-file");
    });

    it("mounts QR code tools on qr request", () => {
      const active = selectActiveToolsForTurn(mockAllTools, {
        userText: "Generate a qr code for my portfolio link",
      });

      expect(active).toHaveProperty("generate-qr-code");
      expect(active).not.toHaveProperty("remove-background");
    });

    it("mounts Site & Deployment tools on website/landing page request", () => {
      const active = selectActiveToolsForTurn(mockAllTools, {
        userText: "Build me a modern landing page website and deploy it",
      });

      expect(active).toHaveProperty("deploy_site");
      expect(active).toHaveProperty("write_site_file");
      expect(active).not.toHaveProperty("list-sms-numbers");
    });

    it("mounts SMS & verification tools on verification query", () => {
      const active = selectActiveToolsForTurn(mockAllTools, {
        userText:
          "I need a temporary phone number to receive an otp sms verification code",
      });

      expect(active).toHaveProperty("list-sms-numbers");
      expect(active).not.toHaveProperty("deploy_site");
    });

    it("mounts Browser & Scraping tools when browsing requested", () => {
      const active = selectActiveToolsForTurn(mockAllTools, {
        userText: "Please browse and scrape this documentation webpage",
      });

      expect(active).toHaveProperty("steel-browser");
    });

    it("unconditionally preserves custom/MCP tools", () => {
      const active = selectActiveToolsForTurn(mockAllTools, {
        userText: "Hello there",
      });

      expect(active).toHaveProperty("mcp_spotify_play");
    });

    it("deduplicates redundant web-search vs web_search alias", () => {
      const active = selectActiveToolsForTurn(mockAllTools, {
        userText: "What is the stock price of Apple?",
      });

      expect(active).toHaveProperty("web-search");
      expect(active).not.toHaveProperty("web_search");
    });
  });

  describe("Workflow Continuity Preservation", () => {
    it("preserves tools invoked in prior turns even if current turn does not mention them", () => {
      const active = selectActiveToolsForTurn(mockAllTools, {
        userText: "Change the title to dark mode version please",
        priorToolCalls: ["generate-pdf"],
      });

      // generate-pdf was in prior calls, so it MUST remain mounted!
      expect(active).toHaveProperty("generate-pdf");
      // Other uncalled specialized domains remain unmounted
      expect(active).not.toHaveProperty("list-sms-numbers");
    });
  });

  describe("extractPriorToolCallsFromMessages", () => {
    it("extracts tool names from toolInvocations and message parts", () => {
      const sampleMessages = [
        {
          role: "user",
          content: "Convert my file",
        },
        {
          role: "assistant",
          toolInvocations: [
            { toolName: "convert-file", args: {} },
            { name: "generate-pdf", args: {} },
          ],
          parts: [
            { type: "text", text: "Working on it..." },
            {
              type: "tool-invocation",
              toolInvocation: { toolName: "generate-pdf", args: {} },
            },
          ],
        },
        {
          role: "user",
          content: "Now do something else",
        },
      ];

      const prior = extractPriorToolCallsFromMessages(sampleMessages);
      expect(prior).toContain("convert-file");
      expect(prior).toContain("generate-pdf");
    });

    it("safely handles empty or malformed message arrays", () => {
      expect(extractPriorToolCallsFromMessages([])).toEqual([]);
      expect(extractPriorToolCallsFromMessages(null as any)).toEqual([]);
      expect(extractPriorToolCallsFromMessages([{} as any])).toEqual([]);
    });
  });

  describe("createGatedHarnessedToolkit Integration", () => {
    it("returns gated tools with circuit breaker protection", async () => {
      const mockSearch = vi.fn().mockResolvedValue("search result");
      const testTools = {
        "web-search": {
          description: "Search web for live queries.",
          execute: mockSearch,
        },
      };

      const harnessed = createGatedHarnessedToolkit(
        testTools,
        { userText: "Search query" },
        { maxRepetitions: 2 },
      );

      expect(harnessed).toHaveProperty("web-search");

      // First call succeeds
      const res1 = await harnessed["web-search"].execute({ q: "apple" }, {});
      expect(res1).toBe("search result");

      // Second identical call succeeds
      const res2 = await harnessed["web-search"].execute({ q: "apple" }, {});
      expect(res2).toBe("search result");

      // Third identical call trips circuit breaker
      const res3 = await harnessed["web-search"].execute({ q: "apple" }, {});
      expect(res3.status).toBe("blocked");
      expect(res3.isCircuitBreaker).toBe(true);
    });

    it("catches runtime errors in DeepSeek reflective error envelope", async () => {
      const failingTool = {
        "web-search": {
          description: "Searches web.",
          execute: vi.fn().mockRejectedValue(new Error("Network timeout 504")),
        },
      };

      const harnessed = createGatedHarnessedToolkit(failingTool, {
        userText: "Query",
      });

      const result = await harnessed["web-search"].execute({ q: "test" }, {});
      expect(result.status).toBe("error");
      expect(result.isReflectiveError).toBe(true);
      expect(result.error).toContain("Network timeout 504");
      expect(result.resolutionHint).toBeDefined();
    });
  });
});
