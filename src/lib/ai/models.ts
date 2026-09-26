import { LanguageModel } from "ai";
import {
  ANTHROPIC_FILE_MIME_TYPES,
  OPENAI_FILE_MIME_TYPES,
} from "./file-support";
import { ChatModel } from "app-types/chat";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const MULTIMODAL_WORKER_URL =
  "https://wasp-multimodal-worker.hhhlproxy.workers.dev";
export const UNIFIED_WORKER_URL = MULTIMODAL_WORKER_URL;
export const CREATIVE_WORKER_URL = MULTIMODAL_WORKER_URL;
export const CLAUDE_WORKER_URL = MULTIMODAL_WORKER_URL;

export const GROQ_WORKER_URL = "https://groq-worker.revai.workers.dev";

function condenseSystemPromptForGroq(
  prompt: string,
  hasPriorToolResults: boolean = false,
): string {
  const currentDateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  if (
    /live spoken voice call|live voice conversation|read aloud word-for-word/i.test(
      prompt,
    )
  ) {
    return `${prompt}\nCurrent Date: ${currentDateStr}. ${
      hasPriorToolResults
        ? "The web-search tool has already been executed; answer naturally in 1 to 3 short spoken sentences using the search data without Markdown tables or URLs."
        : "For live prices, news, or weather, call web-search first, then answer in 1 to 3 short spoken sentences without Markdown tables or URLs."
    }`;
  }
  const stepSpecificSearchRule = hasPriorToolResults
    ? `1. The \`web-search\` tool has ALREADY been executed for this turn and the live search results are in the conversation history below. Do NOT call \`web-search\` again, and NEVER claim that the \`web-search\` tool is unavailable or disabled. Answer the user's question directly using the provided search results.`
    : `1. For ANY real-time data (crypto/stock prices, exchange rates, news, current events, sports, weather, or facts that change), ALWAYS call the \`web-search\` tool immediately with a clear \`query\` parameter.`;

  const coreSearchDirective = `\n\nCurrent Date: ${currentDateStr}.\nCRITICAL TOOL, FORMATTING, CITATION & PLAN LIMIT RULES:\n${stepSpecificSearchRule}\n2. ADAPTIVE EXECUTIVE FORMATTING:\n   - **If answering a Market / Crypto / Stock / Currency / Weather / Price query (with web-search)**:\n     a) Start with a bold **Headline Snapshot** (exact live rate/value in **bold**, date, and inline citation).\n     b) Include a **Markdown Comparison Table** (\`| Source / Platform | Live Rate / Metric | Key Details |\`) across top sources.\n     c) Add **\`### Key Takeaways & Market Context\`** with 3–4 **bold-lead** bullets and inline citations.\n   - **If answering a News / Tech / Sports / General Web Search query**:\n     a) Start with a bold **Executive Summary** directly answering the question with inline citations.\n     b) Organize details using clean \`###\` section headings, a structured **Summary Table** (\`| Topic / Development | Key Details | Source |\`), and **bold-lead** bullet points.\n   - **If answering a Coding / Math / Explanation / General Chat query (where no live web search is needed)**:\n     a) Do NOT call \`web-search\` for pure coding, math, or timeless concepts.\n     b) Present clean, well-structured Markdown with \`###\` headings, syntax-highlighted code blocks, and concise bullet points.\n3. INLINE CITATION SYNTAX (for web-search): Cite every source inline using ONLY standard ASCII Markdown links with NO space between \`]\` and \`(\`, e.g. \`[CoinMarketCap](https://...)\`, \`[Reuters](https://...)\`, \`[TechCrunch](https://...)\`. NEVER use CJK brackets \`【...】\` and NEVER output raw unlinked URLs.\n4. PLAN LIMITS & UPGRADE GUIDANCE: If ANY tool result contains \`LIMIT_EXCEEDED\`, \`SYSTEM_LIMIT_REACHED\`, or \`isLimitExceeded: true\`, NEVER say "I don't have the ability to fetch real-time data". Explicitly inform the user which daily plan limit they reached (all daily limits reset at 4:00 AM IST) and invite them to upgrade at [Upgrade to WaspAI Pro](/subscription):\n   - Free Plan limits (resets daily at 4:00 AM IST): 10 web searches/day, 10 image generations/day, 5 file uploads/day, 50 chat messages/day, 5 mins/week Cloud Browser, 2 custom agents, 0 workflows.\n   - Pro Plan unlocks: Unlimited web searches, Unlimited file/PDF uploads, 300 chat messages/day, Pro image generation & editing, 30 mins/week Cloud Browser, 7 custom agents, 5 workflows.\n   - Ultra Plan unlocks: Unlimited everything (unlimited workflows, custom agents, skills, frontier models, and priority execution).`;

  let condensed = prompt
    .replace(
      /<site_and_game_creation_guidelines>[\s\S]*?<\/site_and_game_creation_guidelines>/gi,
      "",
    )
    .replace(
      /<browser_automation_guidelines>[\s\S]*?<\/browser_automation_guidelines>/gi,
      "",
    )
    .replace(/<system_capabilities>[\s\S]*?<\/system_capabilities>/gi, "")
    .replace(
      /<file_generation_guidelines>[\s\S]*?<\/file_generation_guidelines>/gi,
      "",
    )
    .replace(
      /<image_editing_guidelines>[\s\S]*?<\/image_editing_guidelines>/gi,
      "",
    );

  if (condensed.length > 1800) {
    condensed = condensed.substring(0, 1800);
  }
  return condensed + coreSearchDirective;
}

function compactJsonSchema(schema: any): any {
  if (!schema || typeof schema !== "object") return schema;
  const copy: any = { ...schema };
  if (typeof copy.description === "string" && copy.description.length > 60) {
    copy.description = copy.description.substring(0, 60);
  }
  if (copy.properties && typeof copy.properties === "object") {
    const props: any = {};
    for (const [k, v] of Object.entries(copy.properties)) {
      props[k] = compactJsonSchema(v);
    }
    copy.properties = props;
  }
  if (copy.items && typeof copy.items === "object") {
    copy.items = compactJsonSchema(copy.items);
  }
  return copy;
}

/**
 * Filters and compacts the 34+ tool schemas down to a lean, high-signal schema set for Groq's 8,000 TPM budget.
 * Keeps all core, search, memory, visualization, code, preview, and MCP tools while reducing token usage by ~90%.
 */
function filterAndCompactToolsForGroq(tools: any[], messages: any[]): any[] {
  if (!Array.isArray(tools) || tools.length === 0) return tools;

  const userText = (messages || [])
    .filter((m: any) => m.role === "user")
    .map((m: any) =>
      typeof m.content === "string"
        ? m.content
        : JSON.stringify(m.content || ""),
    )
    .join(" ")
    .toLowerCase();

  const previouslyCalledTools = new Set<string>();
  for (const m of messages || []) {
    if (Array.isArray(m.tool_calls)) {
      for (const tc of m.tool_calls) {
        if (tc.function?.name) previouslyCalledTools.add(tc.function.name);
      }
    }
  }

  // Keep all core WaspAI tools unconditionally available in compact schema form (~580 tokens total) so no user prompt ever misses a tool due to keyword matching
  const alwaysKeep = new Set([
    "web-search",
    "html_preview",
    "createBarChart",
    "createPieChart",
    "createLineChart",
    "createTable",
    "python-execution",
    "mini-javascript-execution",
    "generate-qr-code",
    "generate-pdf",
    "generate-csv",
    "generate-word-document",
    "generate-presentation",
    "save_memory",
    "get_memories",
    "image-manager",
    "web-content",
    "youtube-transcript",
  ]);

  // All built-in default tools; any tool NOT in this set is a custom/MCP tool and will be kept
  const knownBuiltinTools = new Set([
    "web-search",
    "web_search",
    "web-content",
    "scrape-web-page",
    "youtube-transcript",
    "http",
    "createPieChart",
    "createBarChart",
    "createLineChart",
    "createTable",
    "mini-javascript-execution",
    "python-execution",
    "save_memory",
    "update_memory",
    "delete_memory",
    "get_memories",
    "create-temp-email",
    "get-temp-email-messages",
    "send-email",
    "html_preview",
    "fetch_image_as_base64",
    "export-chat-messages",
    "list-sms-numbers",
    "get-sms-messages",
    "create_skill",
    "deploy_site",
    "write_site_file",
    "read_site_file",
    "edit_site_file",
    "video-player",
    "image-manager",
    "remove-background",
    "anime-conversion",
    "enhance-image",
    "remove-watermark",
    "remove-object",
    "super-resolution",
    "restore-old-photo",
    "blur-background",
    "edit-image",
    "analyze-image",
    "steel-browser",
    "generate-word-document",
    "generate-csv",
    "generate-text-file",
    "generate-pdf",
    "generate-presentation",
    "process-ppt",
    "convert-file",
    "generate-qr-code",
    "generate-qr-code-with-logo",
  ]);

  const wantsChartOrTable =
    /\b(chart|graph|plot|pie|bar|line|table|visualiz)\b/i.test(userText);
  const wantsCode =
    /\b(python|javascript|js|execute|run code|calculate|script)\b/i.test(
      userText,
    );
  const wantsMemory =
    /\b(remember|memory|memories|forget|my name|my preference)\b/i.test(
      userText,
    );
  const wantsWebScrapeOrBrowser =
    /\b(https?:\/\/|scrape|crawl|browser|youtube|transcript|video)\b/i.test(
      userText,
    );
  const wantsImage =
    /\b(image|picture|photo|draw|paint|generate.*img|illustrat|avatar|logo|wallpaper|background|watermark|anime|upscale|enhance|restore|blur)\b/i.test(
      userText,
    );
  const wantsDoc =
    /\b(pdf|word|docx|csv|excel|spreadsheet|text file|document|convert file|export|ppt|powerpoint|presentation|slide)\b/i.test(
      userText,
    );
  const wantsQr = /\b(qr|barcode)\b/i.test(userText);
  const wantsSite =
    /\b(html|website|web page|landing page|game|dashboard|widget|preview|deploy|app|ui|skill)\b/i.test(
      userText,
    );
  const wantsSmsOrMail =
    /\b(sms|phone number|otp|verification code|temp mail|temporary email|disposable email|send email)\b/i.test(
      userText,
    );

  const seenNames = new Set<string>();
  const filtered: any[] = [];

  for (const t of tools) {
    const fn = t?.function;
    if (!fn?.name) continue;
    const name: string = fn.name;

    // Deduplicate web_search vs web-search
    if (name === "web_search") continue;
    if (seenNames.has(name)) continue;

    let keep =
      alwaysKeep.has(name) ||
      previouslyCalledTools.has(name) ||
      !knownBuiltinTools.has(name); // Always keep any custom / MCP tools!

    if (!keep) {
      if (
        wantsChartOrTable &&
        (name === "createPieChart" ||
          name === "createBarChart" ||
          name === "createLineChart" ||
          name === "createTable")
      ) {
        keep = true;
      } else if (
        wantsCode &&
        (name === "python-execution" || name === "mini-javascript-execution")
      ) {
        keep = true;
      } else if (
        wantsMemory &&
        (name === "save_memory" ||
          name === "update_memory" ||
          name === "delete_memory" ||
          name === "get_memories")
      ) {
        keep = true;
      } else if (
        wantsWebScrapeOrBrowser &&
        (name === "web-content" ||
          name === "scrape-web-page" ||
          name === "youtube-transcript" ||
          name === "steel-browser" ||
          name === "video-player")
      ) {
        keep = true;
      } else if (
        wantsImage &&
        (name === "image-manager" ||
          name === "remove-background" ||
          name === "enhance-image" ||
          name === "anime-conversion" ||
          name === "remove-watermark" ||
          name === "remove-object" ||
          name === "super-resolution" ||
          name === "restore-old-photo" ||
          name === "blur-background" ||
          name === "edit-image" ||
          name === "analyze-image")
      ) {
        keep = true;
      } else if (
        wantsDoc &&
        (name === "generate-pdf" ||
          name === "generate-word-document" ||
          name === "generate-csv" ||
          name === "generate-text-file" ||
          name === "generate-presentation" ||
          name === "process-ppt" ||
          name === "convert-file")
      ) {
        keep = true;
      } else if (
        wantsQr &&
        (name === "generate-qr-code" || name === "generate-qr-code-with-logo")
      ) {
        keep = true;
      } else if (
        wantsSite &&
        (name === "html_preview" ||
          name === "deploy_site" ||
          name === "write_site_file" ||
          name === "read_site_file" ||
          name === "edit_site_file" ||
          name === "create_skill")
      ) {
        keep = true;
      } else if (
        wantsSmsOrMail &&
        (name === "list-sms-numbers" ||
          name === "get-sms-messages" ||
          name === "create-temp-email" ||
          name === "get-temp-email-messages" ||
          name === "send-email")
      ) {
        keep = true;
      }
    }

    if (!keep) continue;
    seenNames.add(name);

    if (name === "web-search") {
      filtered.push({
        type: "function",
        function: {
          name: "web-search",
          description:
            "Search the web for real-time news, live prices, market rates, and current facts.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description:
                  "The search query (include current month/year for live prices or news)",
              },
            },
            required: ["query"],
          },
        },
      });
      continue;
    }

    filtered.push({
      ...t,
      function: {
        ...fn,
        description:
          typeof fn.description === "string" && fn.description.length > 90
            ? fn.description.substring(0, 90)
            : fn.description,
        parameters: compactJsonSchema(fn.parameters),
      },
    });
  }

  return filtered;
}

/**
 * Strips any leaked DSML (< | DSML | ...>, <｜DSML｜...>) or XML (<invoke>, <tool_call>) tool markup from text.
 */
function stripToolCallMarkup(text: string): string {
  if (!text) return "";
  return text
    .replace(/<[\s|｜]*DSML[\s|｜]*[\s\S]*$/gi, "")
    .replace(/<\/?[\s|｜]*DSML[\s|｜]*[^>]*>/gi, "")
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "")
    .replace(/<function_calls>[\s\S]*?<\/function_calls>/gi, "")
    .replace(/<invoke\b[\s\S]*?<\/[\s|｜]*(?:DSML[\s|｜]*)?invoke>/gi, "")
    .replace(/<parameter\b[\s\S]*?<\/[\s|｜]*(?:DSML[\s|｜]*)?parameter>/gi, "")
    .replace(/<\/?(?:invoke|parameter|tool_call|function_calls)\b[^>]*>/gi, "")
    .replace(
      /【([^】]+)】\s*\(\s*(https?:\/\/[^\s)]+)\s*\)/g,
      (_, label, url) => ` [${label.trim()}](${url.trim()})`,
    )
    .replace(
      /\[([^\]]+)\]\s+\(\s*(https?:\/\/[^\s)]+)\s*\)/g,
      (_, label, url) => `[${label.trim()}](${url.trim()})`,
    )
    .replace(
      /【\s*(https?:\/\/[^\s】]+)\s*】/g,
      (_, url) => ` [Source](${url.trim()})`,
    )
    .replace(/【([^】]{1,48})】/g, (_, inner) => {
      const clean = String(inner).trim();
      const key = clean.toLowerCase();
      const map: Record<string, string> = {
        coinmarketcap: "https://coinmarketcap.com",
        coindesk: "https://www.coindesk.com",
        coinbase: "https://www.coinbase.com",
        binance: "https://www.binance.com",
        coingecko: "https://www.coingecko.com",
        "yahoo finance": "https://finance.yahoo.com",
        reuters: "https://www.reuters.com",
        bloomberg: "https://www.bloomberg.com",
      };
      if (map[key]) return ` [${clean}](${map[key]})`;
      if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(clean)) {
        return ` [${clean}](https://${clean})`;
      }
      return "";
    })
    .replace(/!\s*\[[^\]]*\]\s*\(\s*(?:attachment|sandbox|file):[^)]+\)/gi, "")
    .trim();
}

/**
 * Stitches a continuation response into previous partial content cleanly,
 * stripping redundant duplicate code fences or overlapping prefix lines.
 */
export function stitchContinuation(
  previousContent: string,
  continuationText: string,
): string {
  if (!continuationText) return previousContent;
  let cleanCont = continuationText;

  // 1. If previous content has an unclosed code block (odd number of ``` fences)
  const codeFenceMatches = previousContent.match(/```/g) || [];
  const insideCodeBlock = codeFenceMatches.length % 2 === 1;

  if (insideCodeBlock) {
    // If continuation started with redundant opening code fence, strip it
    cleanCont = cleanCont.replace(/^```[a-zA-Z0-9_-]*\r?\n/, "");
  }

  // 2. Check if continuation repeats the last line of previousContent
  const prevLines = previousContent.split("\n");
  const lastLine = prevLines[prevLines.length - 1].trim();
  if (lastLine.length > 5) {
    const contLines = cleanCont.split("\n");
    const firstContLine = contLines[0].trim();
    if (firstContLine === lastLine) {
      cleanCont = contLines.slice(1).join("\n");
      if (!previousContent.endsWith("\n")) {
        return `${previousContent}\n${cleanCont}`;
      }
    } else if (firstContLine.startsWith(lastLine)) {
      cleanCont =
        firstContLine.slice(lastLine.length).trimStart() +
        "\n" +
        contLines.slice(1).join("\n");
    }
  }

  // If previousContent ends with a trailing space and cleanCont starts with a space, collapse
  if (previousContent.endsWith(" ") && cleanCont.startsWith(" ")) {
    cleanCont = cleanCont.trimStart();
  }

  return previousContent + cleanCont;
}

function makeToolCallId(index = 0): string {
  // 9 alphanumeric chars (a-zA-Z0-9) satisfies strict Mistral and OpenAI tool_call_id validation
  const rand = Math.random().toString(36).substring(2, 9).padEnd(7, "0");
  return `tc${index}${rand}`.slice(0, 9);
}

/**
 * Robustly extracts a leaked tool call from DeepSeek DSML (< | DSML | calls>...), XML (<invoke>...),
 * or JSON (full text or trailing JSON in reasoning/content).
 * Returns the normalized toolName, args, and cleanedText with the markup stripped.
 */
function extractLeakedToolCall(
  rawText: string,
): { toolName: string; args: any; cleanedText: string } | null {
  if (!rawText) return null;
  const text = rawText.trim();

  // 1. Check for DeepSeek DSML (< | DSML | invoke name="..."> or <｜DSML｜parameter name="...">) or XML <invoke>
  if (
    /DSML/i.test(text) ||
    /<invoke\b/i.test(text) ||
    /<parameter\b/i.test(text)
  ) {
    const invokeMatch = text.match(/invoke\s+name=["']?([^"'\s>]+)["']?/i);
    let detectedTool = invokeMatch ? invokeMatch[1] : "";
    const params: Record<string, any> = {};
    const paramRegex =
      /parameter\s+name=["']?([^"'\s>]+)["']?[^>]*>([\s\S]*?)<\/[\s|｜]*(?:DSML[\s|｜]*)?parameter>/gi;
    let m: RegExpExecArray | null;
    while ((m = paramRegex.exec(text)) !== null) {
      const k = m[1].trim();
      const v = m[2].trim();
      params[k] = v;
    }
    if (!detectedTool && (params.query || params.q || params.search_query)) {
      detectedTool = "web-search";
    }
    if (detectedTool) {
      const normName =
        detectedTool === "web_search" || detectedTool === "search"
          ? "web-search"
          : detectedTool;
      const finalArgs =
        normName === "web-search"
          ? {
              query: String(
                params.query || params.q || params.search_query || "",
              ).trim(),
            }
          : params;
      if (normName !== "web-search" || finalArgs.query) {
        return {
          toolName: normName,
          args: finalArgs,
          cleanedText: stripToolCallMarkup(text),
        };
      }
    }
  }

  // 2. Check for trailing or full JSON object (including OpenAI Harmony `to=functions.<name> ... {...}`)
  const harmonyToolMatch = text.match(/to=functions\.([a-zA-Z0-9_-]+)/i);
  const harmonyToolName = harmonyToolMatch ? harmonyToolMatch[1] : "";

  const lastClose = text.lastIndexOf("}");
  if (lastClose === -1) return null;

  let depth = 0;
  let startIdx = -1;
  let inStr = false;
  let esc = false;
  for (let i = lastClose; i >= 0; i--) {
    const ch = text[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (ch === "\\") {
      esc = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      continue;
    }
    if (!inStr) {
      if (ch === "}") depth++;
      else if (ch === "{") {
        depth--;
        if (depth === 0) {
          startIdx = i;
          break;
        }
      }
    }
  }

  if (startIdx === -1) return null;
  const jsonCandidate = text.slice(startIdx, lastClose + 1);

  try {
    const parsed = JSON.parse(jsonCandidate);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const cleanSlice = () =>
      stripToolCallMarkup(
        (text.slice(0, startIdx) + text.slice(lastClose + 1))
          .replace(/<\|channel\|>[\s\S]*$/gi, "")
          .replace(/to=functions\.[a-zA-Z0-9_-]+[\s\S]*$/gi, "")
          .replace(/```(?:json)?\s*$/i, "")
          .replace(/<\/?tool_call>\s*$/gi, ""),
      );

    if (harmonyToolName) {
      const normName =
        harmonyToolName === "web_search" || harmonyToolName === "search"
          ? "web-search"
          : harmonyToolName;
      const directArgs =
        parsed.arguments || parsed.parameters || parsed.args || parsed;
      return {
        toolName: normName,
        args: directArgs,
        cleanedText: cleanSlice(),
      };
    }

    const toolName =
      parsed.tool ||
      parsed.name ||
      (typeof parsed.function === "string"
        ? parsed.function
        : parsed.function?.name);
    const rawArgs =
      parsed.arguments ||
      parsed.parameters ||
      parsed.args ||
      parsed.function?.arguments;

    if (toolName && typeof toolName === "string" && rawArgs !== undefined) {
      let argsObj: any = rawArgs;
      if (typeof rawArgs === "string") {
        try {
          argsObj = JSON.parse(rawArgs);
        } catch {
          argsObj = { query: rawArgs };
        }
      }
      if (
        (toolName === "web-search" ||
          toolName === "web_search" ||
          toolName === "search") &&
        argsObj &&
        typeof (argsObj.query || argsObj.q || argsObj.search_query) === "string"
      ) {
        return {
          toolName: "web-search",
          args: {
            query: String(
              argsObj.query || argsObj.q || argsObj.search_query,
            ).trim(),
          },
          cleanedText: cleanSlice(),
        };
      }
      return { toolName, args: argsObj, cleanedText: cleanSlice() };
    }

    // Bare search query JSON object: {"query": "Bitcoin price live September 2026", "top_n": 5, ...}
    const q = parsed.query || parsed.q || parsed.search_query;
    if (typeof q === "string" && q.trim().length > 0) {
      return {
        toolName: "web-search",
        args: { query: q.trim() },
        cleanedText: cleanSlice(),
      };
    }
  } catch {
    return null;
  }
  return null;
}

function getLastUserMessageIndex(messages: any[]): number {
  if (!Array.isArray(messages)) return -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") {
      return i;
    }
  }
  return -1;
}

function hasToolResultsAfterLastUserMessage(messages: any[]): boolean {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  const lastUserIdx = getLastUserMessageIndex(messages);
  if (lastUserIdx === -1) {
    return messages.some((m: any) => m?.role === "tool");
  }
  return messages.slice(lastUserIdx + 1).some((m: any) => m?.role === "tool");
}

/**
 * Strips raw tool_calls and role:"tool" messages from COMPLETED earlier turns (before lastUserIdx)
 * so multi-turn conversations never mistake Turn 1's tool results for Turn 2's tool results,
 * while preserving all tool_calls and role:"tool" messages for the active turn (after lastUserIdx).
 */
function prunePriorTurnToolMessages(messages: any[]): any[] {
  if (!Array.isArray(messages) || messages.length === 0) return messages;
  const lastUserIdx = getLastUserMessageIndex(messages);
  if (lastUserIdx <= 0) return messages;

  const pruned: any[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (i < lastUserIdx) {
      if (m.role === "tool") {
        // Skip raw tool outputs from completed prior turns (the assistant already answered them)
        continue;
      }
      if (
        m.role === "assistant" &&
        Array.isArray(m.tool_calls) &&
        m.tool_calls.length > 0
      ) {
        const textContent =
          typeof m.content === "string" ? m.content.trim() : "";
        if (textContent && textContent !== "OK.") {
          pruned.push({
            role: "assistant",
            content: textContent,
          });
        }
        continue;
      }
    }
    pruned.push(m);
  }
  return pruned;
}

function flattenToolMessagesForSynthesis(messages: any[]): any[] {
  const cleanedMessages = prunePriorTurnToolMessages(messages);
  const result: any[] = [];
  for (const m of cleanedMessages || []) {
    if (m.role === "system" && typeof m.content === "string") {
      result.push({
        ...m,
        content: condenseSystemPromptForGroq(m.content, true),
      });
      continue;
    }
    if (
      m.role === "assistant" &&
      Array.isArray(m.tool_calls) &&
      m.tool_calls.length > 0
    ) {
      if (
        m.content &&
        typeof m.content === "string" &&
        m.content.trim() &&
        m.content !== "OK."
      ) {
        result.push({ role: "assistant", content: m.content });
      }
      continue;
    }
    if (m.role === "tool") {
      const raw =
        typeof m.content === "string"
          ? m.content
          : JSON.stringify(m.content || "");
      const isWebSearchPayload =
        raw.includes('"results"') &&
        (raw.includes('"url"') || raw.includes('"favicon"'));
      result.push({
        role: "user",
        content: isWebSearchPayload
          ? `[Live Web Search Data]:\n${raw.slice(0, 2800)}\n\nPlease synthesize the above live data into a rich, well-structured response tailored to the user's question:\n- Start with a bold **Headline Summary** answering the query directly with inline citation.\n- If the query is about prices/rates/metrics, include a **Markdown Comparison Table** (\`| Source / Platform | Live Value | Key Details |\`); if it is about news/events/topics, use clean \`###\` section headings or a **Summary Table** (\`| Topic / Event | Details | Source |\`) and **bold-lead** bullet points.\n- Use ONLY standard ASCII Markdown links \`[SourceName](https://...)\` with NO space between \`]\` and \`(\`, and NEVER use \`【...】\` brackets.`
          : `[Tool Execution Output]:\n${raw.slice(0, 2500)}\n\nThe requested tool has completed execution and rendered its output above. Provide a clear, helpful summary and explanation of the results for the user.`,
      });
      continue;
    }
    result.push(m);
  }
  return result;
}

/**
 * Universal Smart OpenAI-Compatible Fetch Wrapper.
 * Used across all providers (GroqWorker, TokenHarbor, BudsAI, SeekAI, Mistral) to:
 * 1. Compact tool schemas (~98% token reduction, eliminating 8,137-token bloat and 400/413 errors).
 * 2. Normalize conversation history messages (flattening array reasoning/text content on assistant messages and preserving reasoning_content for thinking models).
 * 3. Convert stream:true -> stream:false on the upstream hop and emit clean OpenAI SSE chunks, allowing 100% interception and conversion of leaked DeepSeek DSML (< | DSML | calls>), XML, and JSON tool calls into native tool_calls!
 */
function createSmartOpenAICompatibleFetch(
  getKeys: () => string[],
  defaultModelName = "openai/gpt-oss-120b",
) {
  return async (
    url: RequestInfo | URL,
    options?: RequestInit,
  ): Promise<Response> => {
    let parsedBodyObj: any = null;
    const isMistralApi = String(url).includes("api.mistral.ai");
    const toolIdMap = new Map<string, string>();
    const mapToolId = (id: string, idx = 0) => {
      if (!id) return makeToolCallId(idx);
      if (/^[a-zA-Z0-9]{9}$/.test(id)) return id;
      if (!toolIdMap.has(id)) {
        toolIdMap.set(id, makeToolCallId(toolIdMap.size + idx));
      }
      return toolIdMap.get(id)!;
    };

    if (options && options.body) {
      try {
        const bodyObj = JSON.parse(options.body as string);
        if (bodyObj.stream) {
          bodyObj.stream = false;
        }
        // Allow up to 8192 output tokens so large code, documentation, and reasoning models don't get truncated
        const targetMaxTokens = 8192;
        if (!bodyObj.max_tokens || bodyObj.max_tokens < targetMaxTokens) {
          bodyObj.max_tokens = targetMaxTokens;
        } else if (bodyObj.max_tokens > targetMaxTokens) {
          bodyObj.max_tokens = targetMaxTokens;
        }
        if (bodyObj.max_completion_tokens) {
          bodyObj.max_completion_tokens = Math.min(
            Math.max(bodyObj.max_completion_tokens, targetMaxTokens),
            targetMaxTokens,
          );
        }
        if (Array.isArray(bodyObj.messages)) {
          bodyObj.messages = prunePriorTurnToolMessages(bodyObj.messages);
          const hasPriorToolResults = hasToolResultsAfterLastUserMessage(
            bodyObj.messages,
          );
          bodyObj.messages = bodyObj.messages.map((m: any, mIdx: number) => {
            if (m.role === "system" && typeof m.content === "string") {
              return {
                ...m,
                content: condenseSystemPromptForGroq(
                  m.content,
                  hasPriorToolResults,
                ),
              };
            }
            if (m.role === "assistant") {
              let cleanText = "";
              let extractedReasoning = m.reasoning_content || m.reasoning || "";
              if (typeof m.content === "string") {
                cleanText = stripToolCallMarkup(m.content);
              } else if (Array.isArray(m.content)) {
                const textParts = m.content
                  .filter((p: any) => p.type === "text" && p.text)
                  .map((p: any) => p.text)
                  .join("\n\n");
                const reasoningParts = m.content
                  .filter((p: any) => p.type === "reasoning" && p.text)
                  .map((p: any) => p.text)
                  .join("\n\n");
                if (reasoningParts && !extractedReasoning) {
                  extractedReasoning = stripToolCallMarkup(reasoningParts);
                }
                cleanText = stripToolCallMarkup(
                  textParts || reasoningParts || "",
                );
              }
              const hasTools =
                Array.isArray(m.tool_calls) && m.tool_calls.length > 0;
              const normToolCalls = hasTools
                ? m.tool_calls.map((tc: any, tIdx: number) => ({
                    ...tc,
                    id: mapToolId(tc.id, tIdx),
                  }))
                : undefined;
              const needsReasoningInput =
                !isMistralApi &&
                !String(url).includes("groq") &&
                /\b(deepseek|mimo|step|glm)\b/i.test(
                  String(bodyObj.model || defaultModelName),
                );
              const cleanedAssistantMsg: any = {
                ...m,
                content: hasTools ? cleanText || "" : cleanText || "OK.",
                ...(normToolCalls ? { tool_calls: normToolCalls } : {}),
              };
              delete cleanedAssistantMsg.reasoning;
              if (needsReasoningInput && (hasTools || extractedReasoning)) {
                cleanedAssistantMsg.reasoning_content =
                  extractedReasoning ||
                  "Analyzing request and invoking web-search tool.";
              } else {
                delete cleanedAssistantMsg.reasoning_content;
              }
              return cleanedAssistantMsg;
            }
            if (m.role === "tool") {
              const rawContent =
                typeof m.content === "string"
                  ? m.content
                  : JSON.stringify(m.content || "");
              return {
                ...m,
                tool_call_id: m.tool_call_id
                  ? mapToolId(m.tool_call_id, mIdx)
                  : makeToolCallId(mIdx),
                content:
                  rawContent.length > 2500
                    ? rawContent.substring(0, 2500)
                    : rawContent,
              };
            }
            return m;
          });
        }
        if (Array.isArray(bodyObj.tools)) {
          bodyObj.tools = filterAndCompactToolsForGroq(
            bodyObj.tools,
            bodyObj.messages || [],
          );
        }
        parsedBodyObj = bodyObj;
        options = {
          ...options,
          body: JSON.stringify(bodyObj),
        };
      } catch (_e) {}
    }

    const parseResponseJsonOrSse = async (response: Response): Promise<any> => {
      const rawText = await response.text();
      const trimmed = rawText.trim();
      if (!trimmed) return {};
      try {
        return JSON.parse(trimmed);
      } catch (_jsonErr) {
        let accReasoning = "";
        let accContent = "";
        let accFinishReason: string | null = null;
        let modelId = defaultModelName;
        let respId = "chatcmpl-sse";
        const toolCallMap = new Map<number, any>();
        for (const line of trimmed.split(/\r?\n/)) {
          const l = line.trim();
          if (!l.startsWith("data:")) continue;
          const payload = l.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const chunk = JSON.parse(payload);
            if (chunk.id) respId = chunk.id;
            if (chunk.model) modelId = chunk.model;
            const choice = chunk.choices?.[0];
            if (!choice) continue;
            if (choice.finish_reason) {
              accFinishReason = choice.finish_reason;
            }
            const d = choice.delta || choice.message || {};
            if (d.reasoning || d.reasoning_content) {
              accReasoning += d.reasoning || d.reasoning_content;
            }
            if (d.content) {
              accContent += d.content;
            }
            if (Array.isArray(d.tool_calls)) {
              for (const tc of d.tool_calls) {
                const idx = typeof tc.index === "number" ? tc.index : 0;
                const existing = toolCallMap.get(idx) || {
                  id: tc.id || makeToolCallId(idx),
                  type: "function",
                  function: { name: "", arguments: "" },
                };
                if (tc.id) existing.id = tc.id;
                if (tc.function?.name)
                  existing.function.name += tc.function.name;
                if (tc.function?.arguments)
                  existing.function.arguments += tc.function.arguments;
                toolCallMap.set(idx, existing);
              }
            }
          } catch (_chunkErr) {}
        }
        const assembledTools = Array.from(toolCallMap.values());
        return {
          id: respId,
          model: modelId,
          choices: [
            {
              index: 0,
              finish_reason: accFinishReason || "stop",
              message: {
                role: "assistant",
                reasoning: accReasoning,
                content: accContent,
                ...(assembledTools.length > 0
                  ? { tool_calls: assembledTools }
                  : {}),
              },
            },
          ],
        };
      }
    };

    const doFetchWithKeys = async (reqOptions?: RequestInit) => {
      const keys = getKeys();
      let lastRes: Response | null = null;
      let lastErr: any = null;
      for (const key of keys) {
        try {
          const headers = new Headers(reqOptions?.headers || {});
          if (key && key !== "dummy") {
            headers.set("Authorization", `Bearer ${key}`);
          }
          const r = await fetch(url, {
            ...reqOptions,
            headers,
            signal: AbortSignal.timeout(60000),
          });
          lastRes = r;
          if (r.ok) return r;
          if (
            r.status === 401 ||
            r.status === 429 ||
            r.status === 413 ||
            r.status >= 500
          ) {
            continue;
          }
          return r;
        } catch (err) {
          lastErr = err;
        }
      }
      if (lastRes) return lastRes;
      if (lastErr) throw lastErr;
      return fetch(url, reqOptions);
    };

    let res: Response;
    try {
      res = await doFetchWithKeys(options);
      for (
        let retry = 0;
        retry < 2 &&
        (res.status === 429 || res.status === 413 || res.status >= 500);
        retry++
      ) {
        res = await doFetchWithKeys(options);
      }
    } catch (_fetchErr) {
      res = new Response(
        JSON.stringify({ error: { message: "Upstream timeout" } }),
        { status: 504 },
      );
    }

    const messagesList: any[] = parsedBodyObj?.messages || [];
    const hasToolResultsInHistory =
      hasToolResultsAfterLastUserMessage(messagesList);
    const lastUserMsg = [...messagesList]
      .reverse()
      .find((m: any) => m.role === "user");
    const fallbackQueryText = (
      typeof lastUserMsg?.content === "string"
        ? lastUserMsg.content
        : Array.isArray(lastUserMsg?.content)
          ? lastUserMsg.content
              .map((p: any) => p.text || "")
              .join(" ")
              .trim()
          : ""
    ).trim();

    let recoveredJson: any = null;
    if (!res.ok) {
      let errText = "";
      try {
        errText = await res.text();
        console.error(`[SmartProvider HTTP ${res.status}]`, errText);
        try {
          const errJson = JSON.parse(errText);
          const failedGen =
            errJson?.error?.failed_generation || errJson?.failed_generation;
          if (typeof failedGen === "string" && failedGen.trim().length > 0) {
            const extracted = extractLeakedToolCall(failedGen);
            if (extracted) {
              const normToolName =
                extracted.toolName === "web_search"
                  ? "web-search"
                  : extracted.toolName;
              const finalArgs =
                normToolName === "web-search"
                  ? {
                      query:
                        String(
                          extracted.args?.query ||
                            extracted.args?.q ||
                            extracted.args?.search_query ||
                            fallbackQueryText,
                        ).trim() || fallbackQueryText,
                    }
                  : extracted.args;
              recoveredJson = {
                id: "chatcmpl-recovered",
                choices: [
                  {
                    message: {
                      role: "assistant",
                      reasoning: extracted.cleanedText,
                      content: "",
                      tool_calls: [
                        {
                          id: makeToolCallId(0),
                          type: "function",
                          function: {
                            name: normToolName,
                            arguments: JSON.stringify(finalArgs),
                          },
                        },
                      ],
                    },
                  },
                ],
              };
            } else if (!hasToolResultsInHistory && fallbackQueryText) {
              recoveredJson = {
                id: "chatcmpl-recovered",
                choices: [
                  {
                    message: {
                      role: "assistant",
                      reasoning: "",
                      content: "",
                      tool_calls: [
                        {
                          id: makeToolCallId(0),
                          type: "function",
                          function: {
                            name: "web-search",
                            arguments: JSON.stringify({
                              query: fallbackQueryText,
                            }),
                          },
                        },
                      ],
                    },
                  },
                ],
              };
            }
          }
        } catch (_parseErr) {}

        // Retry with flattened messages and no tools so Step 1 or Step 2 always succeeds
        if (!recoveredJson && parsedBodyObj) {
          const fallbackBody = {
            ...parsedBodyObj,
            messages: flattenToolMessagesForSynthesis(parsedBodyObj.messages),
            max_tokens: 8192,
          };
          delete fallbackBody.tools;
          delete fallbackBody.tool_choice;
          const retryRes = await doFetchWithKeys({
            ...options,
            body: JSON.stringify(fallbackBody),
          });
          if (retryRes.ok) {
            res = retryRes;
          } else {
            // Silent cross-provider rescue: route to working internal model (gpt-oss-120b) without exposing fallback model name
            try {
              const rescueBody = {
                ...parsedBodyObj,
                model: "gpt-oss-120b",
                max_tokens: 8192,
              };
              const rescueRes = await fetch(
                `${GROQ_WORKER_URL}/v1/chat/completions`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer dummy",
                  },
                  body: JSON.stringify(rescueBody),
                  signal: AbortSignal.timeout(45000),
                },
              );
              if (rescueRes.ok) {
                res = rescueRes;
              }
            } catch (_rescueErr) {}
          }
        }
      } catch (_e) {}
      if (!res.ok && !recoveredJson) {
        return new Response(errText || "Upstream Error", {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    try {
      const json = recoveredJson || (await parseResponseJsonOrSse(res));
      const firstChoice = json.choices?.[0] || {};
      const msg = firstChoice.message || {};
      let reasoning = msg.reasoning || msg.reasoning_content || "";
      const content = msg.content || "";
      let toolCalls = msg.tool_calls;
      let effectiveContent = content;
      let upstreamFinishReason = firstChoice.finish_reason || "stop";

      // Normalize tool names and arguments on native tool_calls
      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        toolCalls = toolCalls.map((tc: any, idx: number) => {
          const rawName = tc.function?.name;
          const normName =
            rawName === "web_search" || rawName === "search"
              ? "web-search"
              : rawName;
          let normArgs = tc.function?.arguments;
          if (normName === "web-search") {
            let extractedQ = "";
            if (typeof normArgs === "string") {
              try {
                const p = JSON.parse(normArgs);
                if (
                  p &&
                  typeof (p.query || p.q || p.search_query) === "string"
                ) {
                  extractedQ = String(p.query || p.q || p.search_query).trim();
                }
              } catch {}
            } else if (normArgs && typeof normArgs === "object") {
              extractedQ = String(
                normArgs.query || normArgs.q || normArgs.search_query || "",
              ).trim();
            }
            normArgs = JSON.stringify({
              query: extractedQ || fallbackQueryText,
            });
          }
          return {
            ...tc,
            id: mapToolId(tc.id, idx),
            function: {
              ...tc.function,
              name: normName,
              arguments: normArgs,
            },
          };
        });
      }

      // If the model leaked a tool call as DSML (< | DSML | calls>), XML, or raw JSON in content OR reasoning, extract and recover it!
      if (!toolCalls || toolCalls.length === 0) {
        const fromContent = extractLeakedToolCall(effectiveContent);
        if (fromContent) {
          const normalizedName =
            fromContent.toolName === "web_search"
              ? "web-search"
              : fromContent.toolName;
          toolCalls = [
            {
              id: makeToolCallId(0),
              type: "function",
              function: {
                name: normalizedName,
                arguments:
                  typeof fromContent.args === "string"
                    ? fromContent.args
                    : JSON.stringify(fromContent.args),
              },
            },
          ];
          effectiveContent = fromContent.cleanedText;
        } else {
          const fromReasoning = extractLeakedToolCall(reasoning);
          if (fromReasoning) {
            const normalizedName =
              fromReasoning.toolName === "web_search"
                ? "web-search"
                : fromReasoning.toolName;
            toolCalls = [
              {
                id: makeToolCallId(0),
                type: "function",
                function: {
                  name: normalizedName,
                  arguments:
                    typeof fromReasoning.args === "string"
                      ? fromReasoning.args
                      : JSON.stringify(fromReasoning.args),
                },
              },
            ];
            reasoning = fromReasoning.cleanedText;
          }
        }
      }

      // Always strip any residual DSML/XML tool markup from both effectiveContent and reasoning
      effectiveContent = stripToolCallMarkup(effectiveContent);
      reasoning = stripToolCallMarkup(reasoning);

      const isRefusingLiveSearch =
        /\b(web-search tool isn't available|web search tool is not available|web-search is unavailable|can't retrieve live|cannot retrieve live|don't have access to live|no access to real-time|don['’]t have live web-search|no live web-search|unable to provide a citation-backed|run a fresh web search)\b/i.test(
          effectiveContent,
        ) ||
        (!hasToolResultsInHistory &&
          /\b(we need to perform a web search|web-search results \(none yet\)|need to call web-search)\b/i.test(
            reasoning,
          ));

      // Prevent infinite tool loops: if Step 2+ already has tool results in history and the model tries to call web-search AGAIN (or falsely claims web-search is unavailable), clear both toolCalls and pre-tool filler so Step 2 forces final answer synthesis!
      if (
        hasToolResultsInHistory &&
        ((Array.isArray(toolCalls) &&
          toolCalls.length > 0 &&
          toolCalls.every((tc: any) => tc.function?.name === "web-search")) ||
          isRefusingLiveSearch)
      ) {
        toolCalls = undefined;
        effectiveContent = "";
      }

      // If Step 1 produced reasoning about needing to search/fetch live info (or falsely refused live search), synthesize web-search!
      if (
        (!toolCalls || toolCalls.length === 0) &&
        !hasToolResultsInHistory &&
        ((!effectiveContent &&
          reasoning &&
          /\b(web-search|web_search|search|fetch|current|live|price|rate)\b/i.test(
            reasoning,
          )) ||
          isRefusingLiveSearch)
      ) {
        if (fallbackQueryText) {
          const currentMonthYear = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
          });
          toolCalls = [
            {
              id: makeToolCallId(0),
              type: "function",
              function: {
                name: "web-search",
                arguments: JSON.stringify({
                  query: `${fallbackQueryText.slice(0, 120)} ${currentMonthYear}`,
                }),
              },
            },
          ];
          effectiveContent = "";
        }
      }

      // When executing tool calls on Step 1, keep content empty so pre-tool filler or stray tags never clutter above the tool card
      if (toolCalls && toolCalls.length > 0) {
        effectiveContent = "";
      }

      // If Step 2+ (after tool execution) STILL has no content and no tool calls, force a tool-free synthesis call with flattened search results!
      if (
        (!toolCalls || toolCalls.length === 0) &&
        !effectiveContent &&
        parsedBodyObj
      ) {
        try {
          const synthesisBody = {
            ...parsedBodyObj,
            messages: flattenToolMessagesForSynthesis(parsedBodyObj.messages),
            max_tokens: 8192,
          };
          delete synthesisBody.tools;
          delete synthesisBody.tool_choice;
          let synthRes = await doFetchWithKeys({
            ...options,
            body: JSON.stringify(synthesisBody),
          });
          if (!synthRes.ok) {
            try {
              synthRes = await fetch(`${GROQ_WORKER_URL}/v1/chat/completions`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer dummy",
                },
                body: JSON.stringify({
                  ...synthesisBody,
                  model: "gpt-oss-120b",
                }),
                signal: AbortSignal.timeout(20000),
              });
            } catch (_synthRescueErr) {}
          }
          if (synthRes.ok) {
            const synthJson = await parseResponseJsonOrSse(synthRes);
            const synthMsg = synthJson.choices?.[0]?.message || {};
            if (synthMsg.content) {
              effectiveContent = stripToolCallMarkup(synthMsg.content);
            }
          }
        } catch (_e) {}
        if (!effectiveContent && reasoning) {
          effectiveContent = reasoning;
        }
      }

      // Auto-Continuation on Token Limit Truncation (Hermes / DeepSeek auto-continuation)
      // If the model truncated mid-generation due to max output token limits (finish_reason === "length"),
      // seamlessly query the model to continue generation until complete, preventing cutoff code or text.
      let continuationRounds = 0;
      const maxContinuationRounds = 3;
      while (
        upstreamFinishReason === "length" &&
        effectiveContent &&
        (!toolCalls || toolCalls.length === 0) &&
        continuationRounds < maxContinuationRounds
      ) {
        continuationRounds++;
        try {
          const continuationMessages = [
            ...(parsedBodyObj?.messages || []),
            { role: "assistant", content: effectiveContent },
            {
              role: "user",
              content:
                "Your previous response was cut off mid-sentence due to output token limits. Please continue immediately from the exact character where you stopped, without repeating any previous text, code, explanation, or markdown fences.",
            },
          ];
          const contBody = {
            ...parsedBodyObj,
            messages: continuationMessages,
            max_tokens: 8192,
          };
          delete contBody.tools;
          delete contBody.tool_choice;

          const contRes = await doFetchWithKeys({
            ...options,
            body: JSON.stringify(contBody),
          });
          if (contRes.ok) {
            const contJson = await parseResponseJsonOrSse(contRes);
            const contChoice = contJson.choices?.[0] || {};
            const contMsg = contChoice.message || {};
            const contText = stripToolCallMarkup(contMsg.content || "");
            if (contText) {
              effectiveContent = stitchContinuation(effectiveContent, contText);
            }
            upstreamFinishReason = contChoice.finish_reason || "stop";
          } else {
            break;
          }
        } catch (_contErr) {
          break;
        }
      }

      const modelLabel = parsedBodyObj?.model || defaultModelName || json.model;
      const chunks: string[] = [];
      if (reasoning) {
        chunks.push(
          "data: " +
            JSON.stringify({
              id: json.id || "chatcmpl-smart",
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: modelLabel,
              choices: [
                {
                  index: 0,
                  delta: { role: "assistant", reasoning_content: reasoning },
                  finish_reason: null,
                },
              ],
            }) +
            "\n\n",
        );
      }
      if (toolCalls && toolCalls.length > 0) {
        const indexedCalls = toolCalls.map((tc: any, i: number) => ({
          index: i,
          id: mapToolId(tc.id, i),
          type: tc.type || "function",
          function: {
            name: tc.function?.name,
            arguments:
              typeof tc.function?.arguments === "string"
                ? tc.function.arguments
                : JSON.stringify(tc.function?.arguments || {}),
          },
        }));
        chunks.push(
          "data: " +
            JSON.stringify({
              id: json.id || "chatcmpl-smart",
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: modelLabel,
              choices: [
                {
                  index: 0,
                  delta: { role: "assistant", tool_calls: indexedCalls },
                  finish_reason: null,
                },
              ],
            }) +
            "\n\n",
        );
        chunks.push(
          "data: " +
            JSON.stringify({
              id: json.id || "chatcmpl-smart",
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: modelLabel,
              choices: [
                {
                  index: 0,
                  delta: {},
                  finish_reason: "tool_calls",
                },
              ],
              usage: json.usage,
            }) +
            "\n\n",
        );
      } else if (effectiveContent) {
        chunks.push(
          "data: " +
            JSON.stringify({
              id: json.id || "chatcmpl-smart",
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: modelLabel,
              choices: [
                {
                  index: 0,
                  delta: { role: "assistant", content: effectiveContent },
                  finish_reason: null,
                },
              ],
            }) +
            "\n\n",
        );
        chunks.push(
          "data: " +
            JSON.stringify({
              id: json.id || "chatcmpl-smart",
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: modelLabel,
              choices: [
                {
                  index: 0,
                  delta: {},
                  finish_reason: upstreamFinishReason || "stop",
                },
              ],
              usage: json.usage,
            }) +
            "\n\n",
        );
      }
      chunks.push("data: [DONE]\n\n");

      return new Response(chunks.join(""), {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    } catch {
      return res;
    }
  };
}

// Groq Worker Provider (openai/gpt-oss-120b with native reasoning and automatic key rotation)
const groqWorkerProvider = createOpenAICompatible({
  name: "GroqWorker",
  apiKey: "dummy",
  baseURL: `${GROQ_WORKER_URL}/v1`,
  fetch: createSmartOpenAICompatibleFetch(
    () => ["dummy"],
    "openai/gpt-oss-120b",
  ),
});

// Dedicated Multimodal Worker with Smart Fetch
const multimodalProvider = createOpenAICompatible({
  name: "Multimodal AI Worker",
  apiKey: "dummy",
  baseURL: `${MULTIMODAL_WORKER_URL}/v1`,
  fetch: createSmartOpenAICompatibleFetch(
    () => ["dummy"],
    "openai/gpt-oss-120b",
  ),
});
const unifiedProvider = multimodalProvider;
const creativeProvider = multimodalProvider;
const claudeProvider = multimodalProvider;

// Sarvam AI provider
const sarvamProvider = createOpenAICompatible({
  name: "Sarvam",
  apiKey: process.env.SARVAM_API_KEY || "dummy",
  baseURL: "https://api.sarvam.ai/v1",
  headers: {
    "api-subscription-key": process.env.SARVAM_API_KEY || "",
  },
  fetch: async (url, options) => {
    if (options?.body) {
      try {
        const parsedBody = JSON.parse(options.body as string);
        console.log(
          "[DEBUG Sarvam Request Body] Messages count:",
          parsedBody.messages?.length,
        );
        parsedBody.messages?.forEach((msg: any, idx: number) => {
          if (msg.tool_calls) {
            console.log(
              `[DEBUG Sarvam Request Body] Message ${idx} tool_calls:`,
              JSON.stringify(msg.tool_calls),
            );
          }
        });
      } catch (e) {
        console.error("[DEBUG Sarvam Request Body] Parse error:", e);
      }
    }
    return fetch(url, options);
  },
});

// HCNSEC AI Provider (Agnes 2.5 Flash / SenseNova)
export const HCNSEC_BASE_URL = "https://api.hcnsec.cn/v1";
export const HCNSEC_DEFAULT_KEYS = [
  "sk-qe2aRHBgUT6E2JTQBPYCZ24qdO7vnpTrtPfj4tLlBupa4Xru",
  "sk-jCvRq7DEZRE7EvLXWRycSDCiyfkOaNR8MC1eb2BpnNMqJpDe",
];

function getHcnsecKeys(): string[] {
  const envKeys = process.env.HCNSEC_API_KEY || process.env.HCNSEC_API_KEYS;
  if (!envKeys) return HCNSEC_DEFAULT_KEYS;
  const split = envKeys
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return split.length > 0 ? split : HCNSEC_DEFAULT_KEYS;
}

const hcnsecProvider = createOpenAICompatible({
  name: "HCNSEC",
  apiKey: "dummy",
  baseURL: HCNSEC_BASE_URL,
  fetch: createSmartOpenAICompatibleFetch(getHcnsecKeys, "auto"),
});

// TokenHarbor AI Provider (DeepSeek V4.1 Flash, Qwen 3.8 Flash, MiMo, etc.)
export const TOKENHARBOR_BASE_URL = "https://tokenharbor.ai/v1";
export const TOKENHARBOR_DEFAULT_KEYS = [
  "thk_live_5XKowZNJ-e-ydWUuqnbm1FO-CIAbO6HWE55G6ad00xC8YfbqGrwYN_wyVXXABLaV",
  "thk_live_7IpjJXQhhVJ-Smyx8s2LsXhKadnt6RRtIDVOWWVMdNZbDUu8m5FAi3TgSLdDAUJR",
];

export const TOKENHARBOR_FREE_MODELS = new Set([
  "deepseek-v4.1-flash:free",
  "deepseek-v4-flash:free",
  "qwen3.8-flash:free",
  "mimo-v2.6-flash:free",
  "mimo-v2.5:free",
]);

function getTokenHarborKeys(): string[] {
  const envKeys =
    process.env.TOKENHARBOR_API_KEY || process.env.TOKENHARBOR_API_KEYS;
  if (!envKeys) return TOKENHARBOR_DEFAULT_KEYS;
  const split = envKeys
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return split.length > 0 ? split : TOKENHARBOR_DEFAULT_KEYS;
}

const tokenHarborProvider = createOpenAICompatible({
  name: "TokenHarbor",
  apiKey: "dummy",
  baseURL: TOKENHARBOR_BASE_URL,
  fetch: createSmartOpenAICompatibleFetch(
    getTokenHarborKeys,
    "deepseek-v4.1-flash:free",
  ),
});

// Mistral AI Provider (mistral-code-latest, ministral-14b-latest, codestral-latest)
export const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";
export const MISTRAL_DEFAULT_KEY =
  "mstrl_k8kdT2jytnkDuQeEUs9Thsr4w6ZAL20j_3ZJm1U";

export const MISTRAL_MODELS = new Set([
  "mistral-code-latest",
  "ministral-14b-latest",
  "ministral-14b",
  "codestral-latest",
]);

function getMistralKey(): string {
  return process.env.MISTRAL_API_KEY?.trim() || MISTRAL_DEFAULT_KEY;
}

const mistralProvider = createOpenAICompatible({
  name: "Mistral",
  apiKey: "dummy",
  baseURL: MISTRAL_BASE_URL,
  fetch: createSmartOpenAICompatibleFetch(
    () => [getMistralKey()],
    "ministral-14b-latest",
  ),
});

// BudsAI Provider (ox-alpha, step-3.7-flash, deepseek-v4-flash)
export const BUDSAI_BASE_URL = "https://apichat.budsin.dev/v1";
export const BUDSAI_DEFAULT_KEY =
  "sk-RlGaIDImXrwXL10wnUYJh5M2WR3W0sHFpNlmZHt0t36Qw9Is";

export const BUDSAI_MODELS = new Set([
  "ox-alpha",
  "step-3.7-flash",
  "deepseek-v4-flash",
]);

function getBudsAiKey(): string {
  return process.env.BUDSAI_API_KEY?.trim() || BUDSAI_DEFAULT_KEY;
}

const budsaiProvider = createOpenAICompatible({
  name: "BudsAI",
  apiKey: "dummy",
  baseURL: BUDSAI_BASE_URL,
  fetch: createSmartOpenAICompatibleFetch(() => [getBudsAiKey()], "ox-alpha"),
});

// SeekAI Provider (deepseek-ai/DeepSeek-V4-Flash-0731, glm-5.3-flash)
export const SEEKAI_BASE_URL = "https://seekai.cc/v1";
export const SEEKAI_DEFAULT_KEY =
  "sk-zCStGYhQQFmPJxr1RsGUh7YGirDm08aaF5bxNCtn3lUFCrOO";

export const SEEKAI_MODELS = new Set([
  "deepseek-ai/DeepSeek-V4-Flash-0731",
  "glm-5.3-flash",
]);

function getSeekAiKey(): string {
  return process.env.SEEKAI_API_KEY?.trim() || SEEKAI_DEFAULT_KEY;
}

const seekaiProvider = createOpenAICompatible({
  name: "SeekAI",
  apiKey: "dummy",
  baseURL: SEEKAI_BASE_URL,
  fetch: createSmartOpenAICompatibleFetch(
    () => [getSeekAiKey()],
    "deepseek-ai/DeepSeek-V4-Flash-0731",
  ),
});

// ─── MIME type heuristic ──────────────────────────────────────────────────────
function getMimeTypes(modelId: string): string[] {
  const id = modelId.toLowerCase();
  if (
    id.includes("gpt") ||
    id.includes("openai") ||
    id.includes("o1") ||
    id.includes("o3")
  ) {
    return Array.from(OPENAI_FILE_MIME_TYPES);
  }
  if (id.includes("claude") || id.includes("anthropic")) {
    return Array.from(ANTHROPIC_FILE_MIME_TYPES);
  }
  return [];
}

// ─── Worker model shape ───────────────────────────────────────────────────────
interface WorkerModel {
  id: string;
  object?: string;
  owned_by?: string;
  created?: number;
}

/**
 * Fetch the full verified model list.
 */
export async function fetchModelsFromWorker(): Promise<WorkerModel[]> {
  try {
    const res = await fetch(`${MULTIMODAL_WORKER_URL}/v1/models`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        return data.data;
      }
    }
  } catch (_err) {}

  return [
    { id: "gpt-oss-120b", owned_by: "openai" },
    { id: "deepseek-v4.1-flash:free", owned_by: "deepseek" },
    { id: "deepseek-v4-flash:free", owned_by: "deepseek" },
    { id: "qwen3.8-flash:free", owned_by: "qwen" },
    { id: "mimo-v2.6-flash:free", owned_by: "xiaomi" },
    { id: "mimo-v2.5:free", owned_by: "xiaomi" },
    { id: "mistral-code-latest", owned_by: "mistral" },
    { id: "ministral-14b-latest", owned_by: "mistral" },
    { id: "codestral-latest", owned_by: "mistral" },
    { id: "ox-alpha", owned_by: "budsai" },
    { id: "step-3.7-flash", owned_by: "budsai" },
    { id: "deepseek-v4-flash", owned_by: "budsai" },
    { id: "deepseek-ai/DeepSeek-V4-Flash-0731", owned_by: "seekai" },
    { id: "glm-5.3-flash", owned_by: "seekai" },
  ];
}

export const DEFAULT_CHAT_MODEL: ChatModel = {
  provider: "OpenAI",
  model: "gpt-oss-120b",
};

const FREE_TIER_MODELS = new Set([
  "gpt-oss-120b",
  "gpt-oss-120b-p2",
  "openai/gpt-oss-120b",
  "deepseek-v4.1-flash:free",
  "deepseek-v4-flash:free",
  "qwen3.8-flash:free",
  "mimo-v2.6-flash:free",
  "mimo-v2.5:free",
  "mistral-code-latest",
  "ministral-14b-latest",
  "ministral-14b",
  "codestral-latest",
  // BudsAI models
  "ox-alpha",
  "step-3.7-flash",
  "deepseek-v4-flash",
  // SeekAI models
  "deepseek-ai/DeepSeek-V4-Flash-0731",
  "glm-5.3-flash",
]);

const LOWERCASE_FREE_TIER_MODELS = new Set(
  Array.from(FREE_TIER_MODELS).map((id) => id.toLowerCase()),
);

const LOWERCASE_EXCLUDED_MODELS = new Set<string>([
  // No models currently excluded
]);

function getBaseModelId(modelId: string): string {
  const parts = modelId.split("/");
  return parts[parts.length - 1].toLowerCase();
}

export function getModelTier(modelId: string): string {
  const lowercaseModelId = modelId.toLowerCase();

  // LordRouter models are Pro tier unless explicitly registered in the free list
  if (
    lowercaseModelId.startsWith("lordrouter-") &&
    !LOWERCASE_FREE_TIER_MODELS.has(lowercaseModelId)
  ) {
    return "Pro";
  }

  const baseId = getBaseModelId(modelId);

  const isExcluded = Array.from(LOWERCASE_EXCLUDED_MODELS).some((exId) => {
    return (
      lowercaseModelId === exId ||
      baseId === exId ||
      lowercaseModelId.endsWith(`-${exId}`) ||
      lowercaseModelId.endsWith(`/${exId}`)
    );
  });
  if (isExcluded) return "Pro";

  const isFree = Array.from(LOWERCASE_FREE_TIER_MODELS).some((freeId) => {
    return (
      lowercaseModelId === freeId ||
      baseId === freeId ||
      lowercaseModelId.endsWith(`-${freeId}`) ||
      lowercaseModelId.endsWith(`/${freeId}`)
    );
  });

  return isFree ? "Free" : "Pro";
}

/**
 * Build modelsInfo from live worker data.
 * Groups models by their `owned_by` field (provider).
 */
export async function buildDynamicModelsInfo() {
  return [
    {
      provider: "OpenAI",
      hasAPIKey: true,
      models: [
        {
          name: "gpt-oss-120b",
          isToolCallUnsupported: false,
          isImageInputUnsupported: true,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
      ],
    },
    {
      provider: "DeepSeek",
      hasAPIKey: true,
      models: [
        {
          name: "deepseek-v4.1-flash:free",
          isToolCallUnsupported: false,
          isImageInputUnsupported: false,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
        {
          name: "deepseek-v4-flash:free",
          isToolCallUnsupported: false,
          isImageInputUnsupported: true,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
      ],
    },
    {
      provider: "Qwen",
      hasAPIKey: true,
      models: [
        {
          name: "qwen3.8-flash:free",
          isToolCallUnsupported: false,
          isImageInputUnsupported: true,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
      ],
    },
    {
      provider: "Xiaomi",
      hasAPIKey: true,
      models: [
        {
          name: "mimo-v2.6-flash:free",
          isToolCallUnsupported: false,
          isImageInputUnsupported: false,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
        {
          name: "mimo-v2.5:free",
          isToolCallUnsupported: false,
          isImageInputUnsupported: false,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
      ],
    },
    {
      provider: "Mistral",
      hasAPIKey: true,
      models: [
        {
          name: "mistral-code-latest",
          isToolCallUnsupported: false,
          isImageInputUnsupported: true,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
        {
          name: "ministral-14b-latest",
          isToolCallUnsupported: false,
          isImageInputUnsupported: false,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
        {
          name: "codestral-latest",
          isToolCallUnsupported: false,
          isImageInputUnsupported: true,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
      ],
    },
    {
      provider: "BudsAI",
      hasAPIKey: true,
      models: [
        {
          name: "ox-alpha",
          isToolCallUnsupported: false,
          isImageInputUnsupported: false,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
        {
          name: "step-3.7-flash",
          isToolCallUnsupported: false,
          isImageInputUnsupported: false,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
        {
          name: "deepseek-v4-flash",
          isToolCallUnsupported: false,
          isImageInputUnsupported: false,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
      ],
    },
    {
      provider: "SeekAI",
      hasAPIKey: true,
      models: [
        {
          name: "deepseek-ai/DeepSeek-V4-Flash-0731",
          isToolCallUnsupported: false,
          isImageInputUnsupported: false,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
        {
          name: "glm-5.3-flash",
          isToolCallUnsupported: false,
          isImageInputUnsupported: false,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
      ],
    },
  ];
}

export function getModelProvider(modelId: string, ownedBy?: string): string {
  const id = modelId.toLowerCase();
  if (id === "waspai-model") return "WaspAI";
  if (id === "auto" || id.includes("agnes")) return "Agnes";
  if (id.includes("sensenova")) return "SenseNova";
  const raw = (ownedBy || "").toLowerCase();

  // Groq worker models
  if (raw === "groqworker" || id.startsWith("groqw-")) return "Groq";

  // Frenix-prefixed models: resolve to the correct vendor before broad pattern checks
  if (id.startsWith("frenix-llama")) return "Meta";
  if (id.startsWith("frenix-gemma") || id.startsWith("frenix-gemini"))
    return "Google";
  if (
    id.startsWith("frenix-mistral") ||
    id.startsWith("frenix-ministral") ||
    id.startsWith("frenix-mixtral")
  )
    return "Mistral";
  if (id.startsWith("frenix-phi")) return "Microsoft";
  if (id.startsWith("frenix-nemotron") || id.startsWith("frenix-riva"))
    return "NVIDIA";
  if (id.startsWith("frenix-glm")) return "Z-AI";
  if (id.startsWith("frenix-minimax")) return "MiniMax";
  if (id.startsWith("frenix-turbo")) return "Perplexity";
  if (id.startsWith("frenix-axion")) return "Axion";
  if (id.startsWith("frenix-qwen")) return "Qwen";
  if (id.startsWith("frenix-grok")) return "xAI";
  if (id.startsWith("frenix-")) return "Frenix";

  if (SEEKAI_MODELS.has(modelId)) return "SeekAI";

  if (
    id.includes("claude") ||
    id.includes("anthropic") ||
    raw.includes("anthropic") ||
    raw.includes("claude") ||
    raw.includes("frenix")
  )
    return "Anthropic";
  if (
    id.includes("gemini") ||
    id.includes("gemma") ||
    raw.includes("google") ||
    raw.includes("gemini")
  )
    return "Google";
  if (
    id.includes("gpt-") ||
    id.includes("o1-") ||
    id.includes("o3-") ||
    id.includes("chatgpt") ||
    raw.includes("openai") ||
    raw.includes("gpt")
  )
    return "OpenAI";
  if (id.includes("deepseek") || raw.includes("deepseek")) return "DeepSeek";
  if (id.includes("llama") || raw.includes("meta") || raw.includes("llama"))
    return "Meta";
  if (id.includes("qwen") || raw.includes("qwen") || raw.includes("alibaba"))
    return "Qwen";
  if (
    id.includes("mistral") ||
    id.includes("mixtral") ||
    raw.includes("mistral") ||
    raw.includes("mixtral")
  )
    return "Mistral";
  if (id.includes("grok") || raw.includes("xai") || raw.includes("grok"))
    return "xAI";
  if (
    id.includes("nvidia") ||
    id.includes("nemotron") ||
    raw.includes("nvidia") ||
    raw.includes("nemotron")
  )
    return "NVIDIA";
  if (
    id.includes("phi-") ||
    id.includes("wizardlm") ||
    raw.includes("microsoft") ||
    raw.includes("phi")
  )
    return "Microsoft";
  if (
    id.includes("kimi") ||
    id.includes("moonshot") ||
    raw.includes("moonshot") ||
    raw.includes("kimi")
  )
    return "Moonshot";
  if (id.includes("minimax") || raw.includes("minimax")) return "MiniMax";
  if (
    id.includes("sonar") ||
    id.includes("perplexity") ||
    raw.includes("perplexity") ||
    raw.includes("sonar")
  )
    return "Perplexity";
  if (
    id.includes("glm") ||
    id.includes("zhipu") ||
    raw.includes("z-ai") ||
    raw.includes("zhipu") ||
    raw.includes("glm")
  )
    return "Z-AI";
  if (BUDSAI_MODELS.has(modelId)) return "BudsAI";
  if (id.includes("step-") || raw.includes("stepfun")) return "StepFun";
  if (id.includes("mimo") || raw.includes("xiaomi") || raw.includes("mimo"))
    return "Xiaomi";
  if (id.includes("command-") || raw.includes("cohere")) return "Cohere";

  if (ownedBy) {
    if (ownedBy.toLowerCase() === "lordrouter") {
      return "Other";
    }
    return ownedBy.charAt(0).toUpperCase() + ownedBy.slice(1);
  }
  return "Other";
}

// ─── Synchronous helpers ─────────────────────────────────────────────────────

export const isToolCallUnsupportedModel = (model: LanguageModel | string) => {
  const modelId =
    typeof model === "string"
      ? model.toLowerCase()
      : ((model as any).modelId || "").toLowerCase();

  // WaspAI model natively supports tool calling
  if (modelId === "waspai-model") {
    return false;
  }

  // Sarvam models support tool calling (sarvam-105b is the only active model)
  if (modelId.startsWith("sarvam-")) {
    return false;
  }

  // GPT-OSS models support tool calling
  if (modelId.includes("gpt-oss")) {
    return false;
  }

  // LordRouter models support tool calling unless they are reasoning/thinking/qwq models
  if (modelId.startsWith("lordrouter-")) {
    if (
      modelId.includes("thinking") ||
      modelId.includes("reasoning") ||
      modelId.includes("qwq")
    ) {
      return true;
    }
    return false;
  }

  // Disable tool calls for all Frenix models (improves response time, prevents empty stream bugs)
  if (modelId.includes("frenix-")) {
    return true;
  }

  // Models that are known to NOT support tool/function calling:
  // - Small guard/safety models (llama-guard)
  // - Very small base models (llama-2-7b, phi-2)
  // - Incompatible Frenix models that fail or return empty tool calls:
  const unsupportedPatterns = [
    "llama-guard",
    "llama-2-7b",
    "llama-2-13b",
    "phi-2",
    "frenix-glm-5",
    "frenix-glm-4.7",
    "frenix-minimax-m2.5",
    "frenix-gemma-4-31b",
    "frenix-gemma-3n-e2b",
    "frenix-riva-translate",
  ];

  const isExcluded = unsupportedPatterns.some((p) => modelId.includes(p));
  if (isExcluded) return true;

  // Agnes and SenseNova models support tool calling
  if (modelId === "auto" || modelId.startsWith("sensenova")) {
    return false;
  }

  // TokenHarbor free models support tool calling
  if (modelId.endsWith(":free") || TOKENHARBOR_FREE_MODELS.has(modelId)) {
    return false;
  }

  // Mistral models support tool calling
  if (
    MISTRAL_MODELS.has(modelId) ||
    modelId.startsWith("ministral-") ||
    modelId.startsWith("codestral-") ||
    modelId === "mistral-code-latest"
  ) {
    return false;
  }

  // BudsAI models support tool calling via createSmartOpenAICompatibleFetch
  if (
    BUDSAI_MODELS.has(modelId) ||
    modelId === "ox-alpha" ||
    modelId === "deepseek-v4-flash" ||
    modelId === "step-3.7-flash"
  ) {
    return false;
  }

  // SeekAI models support tool calling via createSmartOpenAICompatibleFetch
  if (
    SEEKAI_MODELS.has(modelId) ||
    modelId === "glm-5.3-flash" ||
    modelId === "deepseek-ai/deepseek-v4-flash-0731" ||
    modelId === "deepseek-ai/DeepSeek-V4-Flash-0731".toLowerCase()
  ) {
    return false;
  }

  return false;
};

export const isImageInputUnsupportedModel = (_model: LanguageModel) => {
  // We can't do a lookup anymore since there's no static catalog.
  // Instead use the model's specificationVersion or modelId if accessible.
  // For safety, allow all models through (vision check happens at tool level).
  return false;
};

export const getFilePartSupportedMimeTypes = (_model: LanguageModel) => {
  const modelId = (_model as any).modelId || "";
  const specificMimes = getMimeTypes(modelId);
  if (specificMimes.length > 0) return specificMimes;

  return [
    ...Array.from(OPENAI_FILE_MIME_TYPES),
    ...Array.from(ANTHROPIC_FILE_MIME_TYPES),
  ];
};

// ─── Model provider ───────────────────────────────────────────────────────────

export const customModelProvider = {
  /**
   * modelsInfo is now empty at build time.
   * The /api/chat/models route fetches dynamically from the worker.
   */
  modelsInfo: [] as {
    provider: string;
    hasAPIKey: boolean;
    models: {
      name: string;
      isToolCallUnsupported: boolean;
      isImageInputUnsupported: boolean;
      supportedFileMimeTypes: string[];
      tier: string;
    }[];
  }[],

  /**
   * Get a model instance from the unified worker.
   * No lookup table needed — all models use the same provider.
   */
  getModel: (model?: ChatModel): LanguageModel => {
    if (!model) throw new Error("No model specified");
    const modelId = model.model;

    // Mistral provider (mistral-code-latest, ministral-14b-latest, codestral-latest)
    if (
      model.provider === "Mistral" ||
      model.provider?.toLowerCase() === "mistral" ||
      MISTRAL_MODELS.has(modelId) ||
      modelId === "ministral-14b" ||
      modelId === "ministral-14b-latest" ||
      modelId === "mistral-code-latest" ||
      modelId === "codestral-latest"
    ) {
      const resolvedId =
        modelId === "ministral-14b" ? "ministral-14b-latest" : modelId;
      return mistralProvider(resolvedId) as unknown as LanguageModel;
    }

    // SeekAI provider (deepseek-ai/DeepSeek-V4-Flash-0731, glm-5.3-flash)
    if (model.provider === "SeekAI" || SEEKAI_MODELS.has(modelId)) {
      return seekaiProvider(modelId) as unknown as LanguageModel;
    }

    // BudsAI provider (ox-alpha, step-3.7-flash, deepseek-v4-flash)
    if (model.provider === "BudsAI" || BUDSAI_MODELS.has(modelId)) {
      return budsaiProvider(modelId) as unknown as LanguageModel;
    }

    // TokenHarbor provider (DeepSeek V4.1 Flash, Qwen 3.8 Flash, MiMo, etc.)
    if (
      model.provider === "TokenHarbor" ||
      modelId.endsWith(":free") ||
      TOKENHARBOR_FREE_MODELS.has(modelId)
    ) {
      return tokenHarborProvider(modelId) as unknown as LanguageModel;
    }

    if (
      model.provider === "Agnes" ||
      model.provider === "SenseNova" ||
      model.provider === "HCNSEC" ||
      modelId === "auto" ||
      modelId === "sensenova-6.8-flash-lite"
    ) {
      return hcnsecProvider(modelId) as unknown as LanguageModel;
    }

    if (model.provider === "Sarvam" || modelId.startsWith("sarvam-")) {
      return sarvamProvider(modelId) as unknown as LanguageModel;
    }

    // GPT-OSS 120B routed to Groq Worker for native reasoning and high speed
    const lowerId = modelId.toLowerCase();
    if (
      lowerId === "gpt-oss-120b" ||
      lowerId === "gpt-oss-120b-p2" ||
      lowerId === "openai/gpt-oss-120b" ||
      lowerId.includes("gpt-oss-120b") ||
      lowerId.includes("gpt-oss 120b")
    ) {
      return groqWorkerProvider(
        "openai/gpt-oss-120b",
      ) as unknown as LanguageModel;
    }

    // Groq & Open Source models & DeepSeek routed via dedicated Multimodal Worker
    if (
      model.provider?.toLowerCase() === "groq" ||
      model.provider?.toLowerCase() === "deepseek" ||
      lowerId.startsWith("groqw-") ||
      lowerId.startsWith("deepseek-") ||
      lowerId.startsWith("llama-") ||
      lowerId.startsWith("gpt-oss-")
    ) {
      return multimodalProvider(modelId) as unknown as LanguageModel;
    }

    // Default safe fallback: route through multimodal worker preserving modelId
    return multimodalProvider(modelId) as unknown as LanguageModel;
  },
};

export function sanitizeMessageToolCalls<
  T extends { parts?: any; toolInvocations?: any },
>(messages: T[]): T[] {
  return messages.map((msg) => {
    if (!msg.parts || !Array.isArray(msg.parts)) {
      if (
        (msg as any).toolInvocations &&
        Array.isArray((msg as any).toolInvocations)
      ) {
        return {
          ...msg,
          toolInvocations: (msg as any).toolInvocations.map((inv: any) => {
            let cleanArgs = inv.args;
            if (cleanArgs === null || cleanArgs === undefined) {
              cleanArgs = {};
            } else if (typeof cleanArgs === "string") {
              try {
                const parsed = JSON.parse(cleanArgs);
                if (
                  parsed &&
                  typeof parsed === "object" &&
                  !Array.isArray(parsed)
                ) {
                  cleanArgs = parsed;
                } else {
                  cleanArgs = {};
                }
              } catch {
                cleanArgs = {};
              }
            } else if (
              typeof cleanArgs !== "object" ||
              Array.isArray(cleanArgs)
            ) {
              cleanArgs = {};
            }
            return { ...inv, args: cleanArgs };
          }),
        };
      }
      return msg;
    }

    return {
      ...msg,
      parts: msg.parts.map((part: any) => {
        if (
          part.type === "tool-call" ||
          part.type === "dynamic-tool" ||
          part.type?.startsWith("tool-")
        ) {
          let cleanArgs = part.args !== undefined ? part.args : part.input;
          if (cleanArgs === null || cleanArgs === undefined) {
            cleanArgs = {};
          } else if (typeof cleanArgs === "string") {
            try {
              const parsed = JSON.parse(cleanArgs);
              if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
              ) {
                cleanArgs = parsed;
              } else {
                cleanArgs = {};
              }
            } catch {
              cleanArgs = {};
            }
          } else if (
            typeof cleanArgs !== "object" ||
            Array.isArray(cleanArgs)
          ) {
            cleanArgs = {};
          }
          return {
            ...part,
            args: cleanArgs,
            input: cleanArgs,
          };
        }
        return part;
      }),
    };
  });
}

export { unifiedProvider, creativeProvider, claudeProvider };
