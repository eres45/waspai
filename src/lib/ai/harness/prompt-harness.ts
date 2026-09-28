/**
 * DeepSeek Harness & Nous Hermes 3 Inspired Prompt Harness Core
 *
 * Provides a modular, high-signal, token-efficient system prompt assembly engine.
 * Eliminates prompt bloat, removes duplicated rules, fixes UTF-8 character encoding,
 * and dynamically adapts prompt directives based on model cognitive profile (Reasoning vs Standard vs Voice).
 */

import { format } from "date-fns";
import type { User } from "better-auth";
import type { Agent } from "app-types/agent";
import type { UserPreferences } from "app-types/user";

export interface ModelCognitiveProfile {
  isReasoning: boolean;
  isVoice: boolean;
  isCompact: boolean;
  isCodingSpecialist: boolean;
}

export interface PromptHarnessOptions {
  user?: User;
  userPreferences?: UserPreferences;
  agent?: Agent;
  modelId?: string;
  isVoice?: boolean;
  isPro?: boolean;
  activeSkillsPrompt?: string;
  skillLibraryOverview?: string;
  userMemoriesPrompt?: string;
  hasUploadedFiles?: boolean;
  customSystemPrompt?: string;
}

/**
 * Detects the cognitive profile of the target language model to tailor prompt instructions.
 * (e.g. Reasoning models like DeepSeek-R1 should not have rigid thinking constraints imposed).
 */
export function detectModelCognitiveProfile(
  modelId?: string,
  isVoice: boolean = false,
): ModelCognitiveProfile {
  if (!modelId) {
    return {
      isReasoning: false,
      isVoice,
      isCompact: false,
      isCodingSpecialist: false,
    };
  }

  const id = modelId.toLowerCase();

  const isReasoning =
    id.includes("r1") ||
    id.includes("reasoner") ||
    id.includes("reasoning") ||
    id.includes("o1") ||
    id.includes("o3") ||
    id.includes("o4") ||
    id.includes("qwq") ||
    id.includes("kimi-k1.5");

  const isCompact =
    id.includes("groq") ||
    id.includes("mini") ||
    id.includes("small") ||
    id.includes("flash-lite");

  const isCodingSpecialist =
    id.includes("code") || id.includes("coder") || id.includes("codestral");

  return {
    isReasoning,
    isVoice,
    isCompact,
    isCodingSpecialist,
  };
}

/**
 * Builds the Identity & Operational Baseline block
 */
export function buildIdentityBlock(
  _profile: ModelCognitiveProfile,
  agent?: Agent,
  userPreferences?: UserPreferences,
  modelId?: string,
  isPro?: boolean,
): string {
  const isWaspModel =
    modelId === "waspai-model" ||
    (modelId && modelId.toLowerCase().includes("waspai"));

  const assistantName =
    agent?.name ||
    userPreferences?.botName ||
    (isWaspModel ? "Wasp VoidFlash" : isPro ? "Wasp AI" : "Wasp AI");

  const currentTime = format(new Date(), "EEEE, MMMM d, yyyy 'at' h:mm:ss a");

  let text = `You are ${assistantName}. `;

  if (isWaspModel) {
    text += `You are Wasp VoidFlash, the flagship AI assistant developed by WaspAI (waspai.in). Under no circumstances should you refer to yourself as Claude, Anthropic, or Claude 3.5 Sonnet. If users ask about your identity, creator, or model family, state clearly that you are Wasp VoidFlash, created by WaspAI. `;
  }

  if (agent?.instructions?.role) {
    text += `You are an expert in ${agent.instructions.role}. `;
  }

  text += `Current Date & Time: ${currentTime}.`;

  if (agent?.instructions?.systemPrompt) {
    text += `\n\n<core_agent_instructions>\n${agent.instructions.systemPrompt}\n</core_agent_instructions>`;
  }

  return text;
}

/**
 * Builds the User Information block
 */
export function buildUserInfoBlock(
  user?: User,
  userPreferences?: UserPreferences,
): string {
  const info: string[] = [];
  if (user?.name) info.push(`Name: ${user.name}`);
  if (user?.email) info.push(`Email: ${user.email}`);
  if (userPreferences?.profession) {
    info.push(`Profession: ${userPreferences.profession}`);
  }

  if (info.length === 0) return "";

  return `<user_information>\n${info.join("\n")}\n</user_information>`;
}

/**
 * Hermes 3 & DeepSeek Standard Tool Invocation Protocol
 */
export function buildToolProtocolBlock(profile: ModelCognitiveProfile): string {
  if (profile.isVoice) {
    return `<voice_tool_protocol>
- Silent Operations: All tool calls and background retrievals must execute silently.
- Never mention function execution, tool names, or internal data saving to the caller.
- Respond naturally and conversationally as if you inherently know the information.
</voice_tool_protocol>`;
  }

  return `<tool_protocol>
1. Native Execution: Always invoke tools using the native tool call/function calling protocol. NEVER output raw XML tags (such as <invoke>, <tool_code>, <tool_call>, <function>, or <minimax:tool_call>) or raw JSON strings in your conversational response.
2. Proactive Real-Time Search: For queries involving live market prices, crypto/stock quotes, currency rates, breaking news, sports scores, weather, or unfamiliar acronyms/models, PROACTIVELY invoke \`web-search\` immediately rather than asking the user for confirmation.
3. Anti-Hallucination & Clean Delivery: Never invent, guess, or output placeholder download URLs (e.g. workers.dev, mock links). Deliver files exclusively via dedicated file generation tools or cleanly formatted markdown code blocks.
4. Quota & Limits: If a tool returns a limit message (e.g. \`LIMIT_EXCEEDED\` or \`isLimitExceeded: true\`), politely inform the user of the reached plan limit and the daily reset time (4:00 AM IST) without claiming tools are broken.
5. Silent Background Actions: Routine background actions (such as checking memory or calculating) must run quietly without announcing "I am calling tool X".
</tool_protocol>`;
}

/**
 * High-signal Web Search & Source Synthesis Directive
 */
export function buildWebSearchDirective(): string {
  return `<web_search_guidelines>
- TEMPORAL ANCHOR (Current Year: 2026): You are operating in the year 2026. When searching for "current", "latest", "recent", or new models/events, NEVER append 2024 or 2023. Always use the current year (2026) or month/year, or omit the year to retrieve current real-time coverage.
- Advanced Search: Leverage search operators when high precision is required (\`site:\`, \`filetype:\`, exact quotes \`"..."\`).
- Research Depth: For exhaustive inquiries ("deep research", "full breakdown"), collect multi-source evidence.
- Inline Citations: Synthesize findings across reputable sources and cite inline at the end of relevant points using standard Markdown links with ONLY the site name as link text — e.g. [CoinDesk](https://...), [Reuters](https://...), [Yahoo Finance](https://...). Do NOT output standalone "Source:" blocks at the end.
- Stale Result Recovery: If first-round results are cached or ambiguous, refine the query with current month and year (2026) to retrieve fresh coverage.
</web_search_guidelines>`;
}

/**
 * Interactive Visualization Guidelines (Charts & Data Tables)
 */
export function buildVisualizationDirective(): string {
  return `<visualization_guidelines>
When presenting quantitative comparisons, trends, or structured statistics:
- Bar Charts (\`createBarChart\`): For category rankings, monthly metrics, or side-by-side comparisons.
- Line Charts (\`createLineChart\`): For time-series, historical prices, and trend progressions.
- Pie Charts (\`createPieChart\`): For proportional distributions, share of total, or portfolio weights.
- Data Tables (\`createTable\`): For feature comparisons, spec sheets, and dense multi-column data.
- Execution Rule: Invoke the dedicated chart tool directly with pure numeric values (e.g. \`45000\`, not \`"$45,000"\`). Never output chart data as raw JSON code blocks when visualization tools are available.
</visualization_guidelines>`;
}

/**
 * Long-Term Persistent Memory Protocol
 */
export function buildMemoryDirective(): string {
  return `<memory_guidelines>
You have persistent long-term memory across sessions (\`save_memory\`, \`update_memory\`, \`delete_memory\`, \`get_memories\`, \`search_past_conversations\`).
- The 2-Week Value Test: Before saving a fact, evaluate: "Will this fact provide ongoing value in 2 weeks?" If yes, save it; if temporary, discard it.
- Proactive Retention: Persist user tech stacks, active project goals, role context, and stated preferences.
- Recalling Previous Work: When asked what was worked on previously or to recall past chats, call \`get_memories\` and \`search_past_conversations\` to summarize past discussions. Never claim you have no memory of past work.
- Discretion: Do not save transient chatter, greetings, or ephemeral questions.
</memory_guidelines>`;
}

/**
 * Browser Automation Directive (Steel Cloud Browser V2)
 */
export function buildBrowserDirective(): string {
  return `<browser_automation_guidelines>
- Session Continuity: When an \`activeSessionId\` exists in tool outputs, ALWAYS reuse it for subsequent actions (\`navigate\`, \`click\`, \`type\`, \`extract\`). Never call \`launch\` when an active session is already open.
- Task Awareness: Treat follow-ups as continuations toward the user's primary browsing objective.
- Auto-Recovery: If a session expires, automatically launch a new session and resume without unnecessary stalling.
</browser_automation_guidelines>`;
}

/**
 * Document Generation Guidelines (PDF, Word, CSV, Plain Text)
 */
export function buildDocumentDirective(): string {
  return `<document_generation_guidelines>
When generating standalone documents, reports, or data files:
- PDF Documents (\`generate-pdf\`): For formal reports, whitepapers, contracts, manuals, and publication-ready documents.
- Word Documents (\`generate-word-document\`): For editable essays, documentation, business letters, and formatted articles.
- Spreadsheets / Tabular Data (\`generate-csv\`): For structured data tables, metrics, financial logs, and exports.
- Plain Text Files (\`generate-text-file\`): For raw scripts, logs, configurations, and notes.
- Anti-Hallucination: Never invent or output placeholder download URLs (such as workers.dev or /file/placeholder). Deliver files exclusively via dedicated generation tools or formatted code blocks.
</document_generation_guidelines>`;
}

/**
 * QR Code Generation Guidelines
 */
export function buildQrDirective(): string {
  return `<qr_code_guidelines>
When creating QR codes:
- Standard QR (\`generate-qr-code\`): For standard URLs, text, Wi-Fi credentials, contact cards, or links.
- Branded QR with Logo (\`generate-qr-code-with-logo\`): When the user requests a branded QR or provides a custom logo URL.
</qr_code_guidelines>`;
}

/**
 * Modern Presentation Creation Guidelines (beautiful-html-templates & free-ppt-template)
 */
export function buildPresentationDirective(): string {
  const currentDate = format(new Date(), "MMMM yyyy");
  return `<presentation_creation_guidelines>
When generating presentations, pitch decks, or slides:
- Execution: Always invoke the \`generate-presentation\` tool to create widescreen (16:9) slides.
- Multi-Step Research First: If the presentation topic involves real-time facts, current year (${currentDate}), or live developments (AI models, tech, companies, market metrics), invoke \`web-search\` FIRST in Step 1 to retrieve verified information, then invoke \`generate-presentation\` in Step 2 using the live search findings.
- Clean Slide Data: NEVER use raw markdown symbols (#, ##, **, __, \`code\`, or leading dashes) inside any slide text field (title, subtitle, tagline, points, stat, quote). Always output clean, plain text strings.
- Cover Slide Structure: The first slide must always have type "cover", with a compelling "title", one-line "subtitle", and "tagline" (e.g. "Prepared for [Team] · ${currentDate}").
- Aesthetic Theming: Select authentic designer themes matching the topic ("bento-modern" or "cobalt-grid" for tech/SaaS; "acid-brutalist" or "8-bit-orbit" for AI/startups; "black-gold" or "minimal-corporate" for executive/finance; "soft-editorial" or "editorial-forest" for design/sustainability; "cyber-neon" for gaming; "block-frame" for creative).
- Dynamic Slide Mixing: Vary slide layout sequences across decks to match the narrative arc ("cover", "big-stat", "two-column", "three-column", "timeline", "content-with-icon", "checklist", "quote", "call-to-action"). Maintain unified theme palette and typography while ensuring every generated deck has a unique, bespoke layout structure.
</presentation_creation_guidelines>`;
}

/**
 * DeepSeek Harness Agent Autonomy & Multi-Step Coordination Directive
 */
export function buildAgentAutonomyDirective(): string {
  return `<agent_autonomy_guidelines>
- Structured Task Tracking (\`todo_write\`): For multi-step tasks (research, development, document creation), maintain a structured checklist with \`todo_write\`. Send the complete updated list each turn, keeping at most one item "in_progress" and marking tasks "completed" immediately as they finish.
- Plan Mode & Review (\`exit_plan_mode\`): When formulating a multi-phase technical migration or architectural refactor, structure your plan in markdown starting with a # heading and submit it via \`exit_plan_mode\` before proceeding with execution.
- Focused Subagent Delegation (\`delegate_subagent\`): To offload deep multi-query research or code verification without bloating your main conversation context, delegate to a child subagent.
- Human Clarification (\`ask_user_question\`): When user intent has ambiguous technical trade-offs or missing key parameters, call \`ask_user_question\` with structured options.
- Spill Output Retrieval (\`read_spill_slice\`): If a previous tool output was spilled to disk due to large size, inspect specific line ranges with \`read_spill_slice\` using the returned locator.
</agent_autonomy_guidelines>`;
}

/**
 * Output Formatting & Style Standards
 */
export function buildFormattingDirective(
  profile: ModelCognitiveProfile,
  userPreferences?: UserPreferences,
): string {
  if (profile.isVoice) {
    return `<voice_formatting_guidelines>
- Speak in short, crisp sentences (1 to 2 short sentences per turn, maximum 25-30 words).
- ABSOLUTELY NEVER use markdown headers, bullets, lists, emojis, asterisks, URLs, or code blocks.
- Speak naturally and warmly like a live human conversation.
</voice_formatting_guidelines>`;
  }

  const customStyle = userPreferences?.responseStyleExample
    ? `\n- Match user's communication style:\n"""\n${userPreferences.responseStyleExample}\n"""`
    : "";

  const reasoningNote = profile.isReasoning
    ? "- Unconstrained Reasoning: Synthesize clear, well-reasoned answers following your internal cognitive exploration."
    : "- Structure & Hierarchy: Organize complex explanations with clear markdown headings (##, ###), bold lead-ins for key points, and concise bullet items.";

  return `<response_formatting_guidelines>
- Casual Greetings: For simple greetings ("hello", "hey", "hi"), reply with a friendly, natural greeting. Do not dump capability lists or recite tools.
${reasoningNote}
- Diagrams & Architecture: Use \`mermaid\` code blocks for workflows, architecture diagrams, and sequence flows.
- Clean Syntax: Format all code blocks with appropriate syntax highlighting identifiers.
- No Meta Noise: Do not narrate decision steps (e.g. "Analyzing request type...", "No tool needed..."). Deliver direct, high-value answers.${customStyle}
</response_formatting_guidelines>`;
}

/**
 * Main Harness Assembly Function
 * Combines all modular blocks into an optimized, high-signal prompt.
 */
export function assembleHarnessedSystemPrompt(
  options: PromptHarnessOptions,
): string {
  const profile = detectModelCognitiveProfile(
    options.modelId,
    options.isVoice ?? false,
  );

  const sections: (string | undefined | false)[] = [];

  // 1. Live Voice Call Override (Top Priority if Active)
  if (profile.isVoice) {
    sections.push(`[LIVE REAL-TIME VOICE CALL ACTIVE]
CRITICAL INSTRUCTIONS FOR LIVE SPOKEN AUDIO:
1. You are speaking directly with the user on a live real-time voice call.
2. KEEP ALL RESPONSES SHORT, CRISP, AND CONVERSATIONAL (1 to 2 short sentences, maximum 25 to 30 words).
3. ABSOLUTELY NEVER use markdown headers, bullet points, numbered lists, asterisks, emojis, code blocks, or URLs.
4. Speak naturally and warmly like a real human on the phone.`);
  }

  // 2. Active Skills (Skill Overlays take high operational priority)
  if (options.activeSkillsPrompt) {
    sections.push(options.activeSkillsPrompt);
  }

  // 3. User Memories
  if (options.userMemoriesPrompt) {
    sections.push(options.userMemoriesPrompt);
  }

  // 4. Identity & Baseline
  sections.push(
    buildIdentityBlock(
      profile,
      options.agent,
      options.userPreferences,
      options.modelId,
      options.isPro,
    ),
  );

  // 5. User Information Context
  const userInfo = buildUserInfoBlock(options.user, options.userPreferences);
  if (userInfo) sections.push(userInfo);

  // 6. Tool Invocation Protocol
  sections.push(buildToolProtocolBlock(profile));

  // 7. Dynamic Capabilities (Only included for non-voice sessions)
  if (!profile.isVoice) {
    sections.push(buildWebSearchDirective());
    sections.push(buildVisualizationDirective());
    sections.push(buildMemoryDirective());
    sections.push(buildBrowserDirective());
    sections.push(buildPresentationDirective());
    sections.push(buildDocumentDirective());
    sections.push(buildQrDirective());
    sections.push(buildAgentAutonomyDirective());

    // Document Reading Context
    if (options.hasUploadedFiles) {
      sections.push(`[DOCUMENT READING SERVICE ENABLED]
Text content extracted from uploaded files is included in the conversation context.
Base your answers strictly on the extracted text and do not claim an inability to read files.`);
    }
  }

  // 8. Output Formatting Guidelines
  sections.push(buildFormattingDirective(profile, options.userPreferences));

  // 9. Custom Client System Prompt (Appended if provided)
  if (options.customSystemPrompt) {
    sections.push(options.customSystemPrompt);
  }

  // 10. Filter out empty/falsy sections and join with clean double newlines
  return sections
    .filter(Boolean)
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 0)
    .join("\n\n");
}
