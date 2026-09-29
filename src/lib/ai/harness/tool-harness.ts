/**
 * Hermes 3 & DeepSeek Harness Tool Optimization Engine
 *
 * Implements:
 * 1. Schema Minification: Strips boilerplate and verbose descriptions to slash token overhead by up to 70%.
 * 2. Pre-Flight Intent & Context Gating: Retains all core tools, while dynamically mounting specialized
 *    toolkits (Image Editing, Document Processing, Site Deployment, SMS/Temp Mail, Browser) based on user intent and media attachments.
 * 3. Continuity Preservation: Any tool previously invoked in the thread remains active.
 */

import { ActionCircuitBreaker, createHarnessedToolkit } from "./agent-harness";
import globalLogger from "logger";
import { colorize } from "consola/utils";

const logger = globalLogger.withDefaults({
  message: colorize("cyan", "ToolHarness: "),
});

export interface ToolTurnContext {
  userText?: string;
  hasImages?: boolean;
  hasFiles?: boolean;
  priorToolCalls?: string[];
  isVoice?: boolean;
}

// ─── 1. CORE ALWAYS-ON TOOLS ──────────────────────────────────────────────────
// Tools that must be available on every single conversation turn
export const ALWAYS_ACTIVE_TOOLS = new Set([
  "web-search",
  "scrape-web-page",
  "web-content",
  "generate-presentation",
  "image-manager",
  "createBarChart",
  "createLineChart",
  "createPieChart",
  "createTable",
  "python-execution",
  "python",
  "python_execution",
  "run_python",
  "execute_python",
  "read_file",
  "write_file",
  "edit_file",
  "mini-javascript-execution",
  "html_preview",
  "save_memory",
  "update_memory",
  "delete_memory",
  "get_memories",
  "search_past_conversations",
  "sequential-thinking",
  "todo_write",
  "exit_plan_mode",
  "ask_user_question",
  "delegate_subagent",
  "read_spill_slice",
]);

// ─── 2. SPECIALIZED TOOLKIT DOMAINS ───────────────────────────────────────────
export const TOOL_DOMAINS = {
  IMAGE_EDIT: {
    tools: [
      "remove-background",
      "enhance-image",
      "anime-conversion",
      "remove-watermark",
      "remove-object",
      "super-resolution",
      "restore-old-photo",
      "blur-background",
      "edit-image",
      "analyze-image",
      "fetch_image_as_base64",
      "fetch-image-as-base64",
      "video-gen",
      "video-player",
    ],
    keywords: [
      "image",
      "photo",
      "picture",
      "background",
      "watermark",
      "anime",
      "enhance",
      "resolution",
      "upscale",
      "blur",
      "crop",
      "edit",
      "filter",
      "restore",
      "video",
    ],
  },
  DOCUMENT_AND_CONVERSION: {
    tools: [
      "generate-pdf",
      "generate-word-document",
      "generate-csv",
      "generate-text-file",
      "convert-file",
      "generate-presentation",
      "process-ppt",
    ],
    keywords: [
      "pdf",
      "doc",
      "docx",
      "csv",
      "excel",
      "xlsx",
      "spreadsheet",
      "slides",
      "presentation",
      "powerpoint",
      "ppt",
      "pptx",
      "pitch deck",
      "slide deck",
      "deck",
      "powerpoint deck",
      "convert",
      "conversion",
      "document",
      "report",
      "download",
      "export",
    ],
  },
  QR_CODES: {
    tools: ["generate-qr-code", "generate-qr-code-with-logo"],
    keywords: ["qr", "qr code", "qrcode", "barcode"],
  },
  SITE_AND_CODE: {
    tools: [
      "deploy_site",
      "write_site_file",
      "read_site_file",
      "edit_site_file",
      "search_skills",
      "load_skill",
      "create_skill",
    ],
    keywords: [
      "site",
      "deploy",
      "website",
      "web app",
      "landing page",
      "index.html",
      "file",
      "skill",
      "skills",
      "persona",
    ],
  },
  UTILITY_VERIFY: {
    tools: [
      "list-sms-numbers",
      "get-sms-messages",
      "create-temp-email",
      "get-temp-email-messages",
      "send-email",
    ],
    keywords: [
      "sms",
      "phone",
      "number",
      "otp",
      "verification",
      "verify",
      "temp mail",
      "temp email",
      "temporary email",
      "inbox",
      "send email",
      "mail",
    ],
  },
  WEB_BROWSER_EXTRA: {
    tools: [
      "steel-browser",
      "scrape-web-page",
      "web-content",
      "get-youtube-transcript",
      "youtube-transcript",
      "http",
      "http-fetch",
    ],
    keywords: [
      "browser",
      "browse",
      "steel",
      "scrape",
      "crawling",
      "crawl",
      "youtube",
      "transcript",
      "http",
      "fetch url",
      "curl",
      "http://",
      "https://",
      "www.",
      "url",
      "link",
      "website",
      "webpage",
      "clone",
      "replicate",
      "screenshot",
      "inspect page",
      "open page",
    ],
  },
  CHAT_EXPORT: {
    tools: ["export-chat-messages"],
    keywords: ["export chat", "export messages", "download chat"],
  },
};

/**
 * Compacts a tool definition's parameter descriptions to slash token overhead (Hermes pattern).
 */
export function compactToolDefinition(toolDef: any): any {
  if (!toolDef || typeof toolDef !== "object") return toolDef;

  const copy = { ...toolDef };

  if (typeof copy.description === "string" && copy.description.length > 100) {
    const firstSentence = copy.description.split(/\.\s+/)[0]?.trim() || "";
    if (firstSentence.length > 120) {
      copy.description = `${firstSentence.slice(0, 117)}...`;
    } else if (firstSentence.length > 0) {
      copy.description = firstSentence.endsWith(".")
        ? firstSentence
        : `${firstSentence}.`;
    }
  }

  return copy;
}

/**
 * Extracts past tool invocations from previous messages in the conversation to maintain workflow continuity.
 */
export function extractPriorToolCallsFromMessages(messages: any[]): string[] {
  if (!Array.isArray(messages) || messages.length === 0) return [];

  const toolNames = new Set<string>();
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue;

    // 1. Check toolInvocations array
    if (Array.isArray(msg.toolInvocations)) {
      for (const ti of msg.toolInvocations) {
        const name = ti?.toolName || ti?.name;
        if (typeof name === "string" && name) toolNames.add(name);
      }
    }

    // 2. Check parts array
    if (Array.isArray(msg.parts)) {
      for (const part of msg.parts) {
        if (!part || typeof part !== "object") continue;
        if (part.toolInvocation?.toolName) {
          toolNames.add(part.toolInvocation.toolName);
        } else if (part.type === "tool-call" && part.toolName) {
          toolNames.add(part.toolName);
        } else if (part.type === "tool-invocation" && part.toolName) {
          toolNames.add(part.toolName);
        }
      }
    }
  }

  return Array.from(toolNames);
}

/**
 * Pre-Flight Intent & Context Gater (DeepSeek / Hermes Pattern)
 * Analyzes the active conversation state to selectively activate specialized tool domains.
 */
export function selectActiveToolsForTurn(
  allTools: Record<string, any>,
  context: ToolTurnContext,
): Record<string, any> {
  if (!allTools || typeof allTools !== "object") return {};

  // Auto-inject model fallback aliases to prevent "unavailable tool" errors
  if (allTools["scrape-web-page"] || allTools["web-content"]) {
    const scraper = allTools["web-content"] || allTools["scrape-web-page"];
    if (!allTools["web-scrape"]) allTools["web-scrape"] = scraper;
    if (!allTools["web_scrape"]) allTools["web_scrape"] = scraper;
  }
  if (allTools["steel-browser"]) {
    const browser = allTools["steel-browser"];
    if (!allTools["browser"]) allTools["browser"] = browser;
    if (!allTools["steel_browser"]) allTools["steel_browser"] = browser;
    if (!allTools["cloud_browser"]) allTools["cloud_browser"] = browser;
    if (!allTools["web_browser"]) allTools["web_browser"] = browser;
    if (!allTools["screenshot"]) allTools["screenshot"] = browser;
  }
  if (allTools["generate-presentation"]) {
    if (!allTools["create-presentation"]) {
      allTools["create-presentation"] = allTools["generate-presentation"];
    }
    if (!allTools["presentation-generator"]) {
      allTools["presentation-generator"] = allTools["generate-presentation"];
    }
  }

  const userQuery = (context.userText || "").toLowerCase();
  const hasUrl = /https?:\/\/[^\s]+|www\.[^\s]+/i.test(context.userText || "");
  const priorCalls = new Set(
    (context.priorToolCalls || []).map((t) => t.toLowerCase()),
  );

  const activeNames = new Set<string>();

  // 1. Always mount Core Tools
  for (const name of Object.keys(allTools)) {
    if (ALWAYS_ACTIVE_TOOLS.has(name)) {
      activeNames.add(name);
    }
  }

  // 2. Context Triggers: Images
  const isImageTriggered =
    Boolean(context.hasImages) ||
    TOOL_DOMAINS.IMAGE_EDIT.keywords.some((k) => userQuery.includes(k));

  if (isImageTriggered) {
    for (const tool of TOOL_DOMAINS.IMAGE_EDIT.tools) {
      if (allTools[tool]) activeNames.add(tool);
    }
  }

  // 3. Context Triggers: Files & Document Conversions
  const isDocTriggered =
    Boolean(context.hasFiles) ||
    TOOL_DOMAINS.DOCUMENT_AND_CONVERSION.keywords.some((k) =>
      userQuery.includes(k),
    );

  if (isDocTriggered) {
    for (const tool of TOOL_DOMAINS.DOCUMENT_AND_CONVERSION.tools) {
      if (allTools[tool]) activeNames.add(tool);
    }
  }

  // 4. Context Triggers: QR Codes
  if (TOOL_DOMAINS.QR_CODES.keywords.some((k) => userQuery.includes(k))) {
    for (const tool of TOOL_DOMAINS.QR_CODES.tools) {
      if (allTools[tool]) activeNames.add(tool);
    }
  }

  // 5. Context Triggers: Site Deployment & Skills
  if (
    hasUrl ||
    TOOL_DOMAINS.SITE_AND_CODE.keywords.some((k) => userQuery.includes(k))
  ) {
    for (const tool of TOOL_DOMAINS.SITE_AND_CODE.tools) {
      if (allTools[tool]) activeNames.add(tool);
    }
  }

  // 6. Context Triggers: SMS & Temp Email
  if (TOOL_DOMAINS.UTILITY_VERIFY.keywords.some((k) => userQuery.includes(k))) {
    for (const tool of TOOL_DOMAINS.UTILITY_VERIFY.tools) {
      if (allTools[tool]) activeNames.add(tool);
    }
  }

  // 7. Context Triggers: Web Browser / Scraping / Youtube
  if (
    hasUrl ||
    TOOL_DOMAINS.WEB_BROWSER_EXTRA.keywords.some((k) => userQuery.includes(k))
  ) {
    for (const tool of TOOL_DOMAINS.WEB_BROWSER_EXTRA.tools) {
      if (allTools[tool]) activeNames.add(tool);
    }
  }

  // 8. Context Triggers: Chat Export
  if (TOOL_DOMAINS.CHAT_EXPORT.keywords.some((k) => userQuery.includes(k))) {
    for (const tool of TOOL_DOMAINS.CHAT_EXPORT.tools) {
      if (allTools[tool]) activeNames.add(tool);
    }
  }

  // 9. Workflow Continuity: Retain any tool previously called in this thread
  for (const toolName of Object.keys(allTools)) {
    if (priorCalls.has(toolName.toLowerCase())) {
      activeNames.add(toolName);
    }
  }

  // 10. Retain all user-connected custom MCP tools unconditionally
  for (const name of Object.keys(allTools)) {
    const isBuiltin =
      ALWAYS_ACTIVE_TOOLS.has(name) ||
      Object.values(TOOL_DOMAINS).some((d) =>
        (d.tools as string[]).includes(name),
      );

    if (!isBuiltin) {
      activeNames.add(name);
    }
  }

  // Deduplicate redundant aliases (e.g. keep 'web-search', drop 'web_search' duplicate unless specifically requested in prior turn)
  if (
    activeNames.has("web-search") &&
    activeNames.has("web_search") &&
    !priorCalls.has("web_search")
  ) {
    activeNames.delete("web_search");
  }

  // Build filtered dictionary with minified definitions
  const gatedTools: Record<string, any> = {};
  for (const name of activeNames) {
    if (allTools[name]) {
      gatedTools[name] = compactToolDefinition(allTools[name]);
    }
  }

  logger.info(
    `Pre-Flight Tool Gater: Active tools ${Object.keys(gatedTools).length}/${Object.keys(allTools).length} ` +
      `[Image: ${isImageTriggered}, Files: ${isDocTriggered}]`,
  );

  return gatedTools;
}

/**
 * Creates the complete Harnessed & Gated Toolkit for the active turn.
 * Combines Pre-flight context gating, schema minification, action circuit breakers,
 * and reflective error envelopes.
 */
export function createGatedHarnessedToolkit(
  allTools: Record<string, any>,
  context: ToolTurnContext,
  options?: {
    maxRepetitions?: number;
    circuitBreaker?: ActionCircuitBreaker;
  },
): Record<string, any> {
  const gated = selectActiveToolsForTurn(allTools, context);
  return createHarnessedToolkit(gated, options);
}
