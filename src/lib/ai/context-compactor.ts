import { getModelContextLimit } from "./context-limits";
import type { ContextCompactionInfo } from "@/types/chat";

/**
 * Helper to estimate character footprint of a message
 */
export function estimateMessageSize(m: any): number {
  if (!m) return 0;
  if (typeof m.content === "string") return m.content.length + 100;

  const parts = Array.isArray(m.parts) ? m.parts : [];
  return (
    parts.reduce((acc: number, p: any) => {
      let partSize = 0;
      if (p.type === "text") {
        partSize = p.text?.length || 0;
      } else if (p.type === "tool-call") {
        partSize = (JSON.stringify(p.args || {}).length || 0) + 150;
      } else if (p.type === "tool-result") {
        partSize = (JSON.stringify(p.result || {}).length || 0) + 150;
      } else if (p.type === "file") {
        partSize = 300;
      } else if (p.type === "image") {
        partSize = 400;
      }
      return acc + partSize + 50;
    }, 0) + 100
  );
}

/**
 * Extracts key text and actions from an array of messages to form a structured digest.
 */
function generateStructuredDigest(messages: any[]): string {
  const topics: string[] = [];
  const actions: string[] = [];
  const keyFacts: string[] = [];

  for (const msg of messages) {
    const isUser = msg.role === "user";
    const parts = Array.isArray(msg.parts) ? msg.parts : [];

    for (const p of parts) {
      if (p.type === "text" && typeof p.text === "string") {
        const text = p.text.trim();
        if (!text) continue;
        if (isUser) {
          // Take first 120 chars of user intent
          const clean = text.replace(/\s+/g, " ").slice(0, 140);
          if (clean && !topics.includes(clean)) {
            topics.push(clean);
          }
        } else {
          // Check for key answers or statements
          const lines = text
            .split("\n")
            .filter((l: string) => l.trim().length > 0);
          const firstLine = lines[0]?.trim();
          if (
            firstLine &&
            firstLine.length > 10 &&
            !firstLine.startsWith("#")
          ) {
            const clean = firstLine.slice(0, 120);
            if (!keyFacts.includes(clean)) {
              keyFacts.push(clean);
            }
          }
        }
      } else if (p.type === "tool-call") {
        const toolName = p.toolName || p.name;
        if (toolName) {
          const detail = p.args?.query || p.args?.path || p.args?.name || "";
          const actionStr = detail ? `${toolName}(${detail})` : toolName;
          if (!actions.includes(actionStr)) {
            actions.push(actionStr);
          }
        }
      }
    }
  }

  const digestSections: string[] = [];

  if (topics.length > 0) {
    digestSections.push(
      `### Earlier User Inquiries:\n${topics
        .slice(-5)
        .map((t) => `- ${t}`)
        .join("\n")}`,
    );
  }

  if (actions.length > 0) {
    digestSections.push(
      `### Tools & Operations Executed:\n${actions
        .slice(-6)
        .map((a) => `- ${a}`)
        .join("\n")}`,
    );
  }

  if (keyFacts.length > 0) {
    digestSections.push(
      `### Context & Decisions Established:\n${keyFacts
        .slice(-4)
        .map((f) => `- ${f}`)
        .join("\n")}`,
    );
  }

  return (
    digestSections.join("\n\n") ||
    "Earlier conversation covered setup and initial task execution."
  );
}

export interface CompactionResult {
  messages: any[];
  compactionInfo?: ContextCompactionInfo;
}

/**
 * Compacts conversation history when it approaches token limits or gets long.
 * Keeps recent messages intact while condensing older messages into a compact digest.
 */
export function compactConversationContext({
  messages,
  modelId,
  systemPromptLength = 4000,
}: {
  messages: any[];
  modelId: string;
  systemPromptLength?: number;
}): CompactionResult {
  if (!messages || messages.length <= 6) {
    return { messages };
  }

  const maxContextChars = getModelContextLimit(modelId);
  const currentMessage = messages[messages.length - 1];
  const currentMsgSize = estimateMessageSize(currentMessage);
  const budget = maxContextChars - currentMsgSize - systemPromptLength;

  // Calculate total history size
  const pastMessages = messages.slice(0, -1);
  const totalHistoryChars = pastMessages.reduce(
    (acc, m) => acc + estimateMessageSize(m),
    0,
  );

  // Compaction triggers if:
  // 1. Total history size exceeds 60% of available budget, OR
  // 2. Total messages exceed 14 messages and history size is over 35,000 chars (~9,000 tokens)
  const isBudgetExceeded = totalHistoryChars > budget * 0.65;
  const isMessageCountHigh =
    messages.length >= 12 && totalHistoryChars > 32_000;

  if (!isBudgetExceeded && !isMessageCountHigh) {
    return { messages };
  }

  // Preserve the most recent 6 messages in full fidelity
  const preserveRecentCount = Math.min(
    6,
    Math.max(3, Math.floor(messages.length * 0.35)),
  );
  const olderMessages = pastMessages.slice(0, -preserveRecentCount);
  const recentMessages = pastMessages.slice(-preserveRecentCount);

  if (olderMessages.length < 2) {
    return { messages };
  }

  // Build the structured digest of older messages
  const digest = generateStructuredDigest(olderMessages);
  const digestContent = `[Context Memory Digest: ${olderMessages.length} earlier messages were compacted to conserve context space]\n${digest}\n[Older detail is in digests — reference previous artifacts or re-read files as needed.]`;

  const digestMessage = {
    role: "system",
    id: `compaction-digest-${Date.now()}`,
    content: digestContent,
    parts: [{ type: "text", text: digestContent }],
  };

  const compactedMessages = [digestMessage, ...recentMessages, currentMessage];

  // Token calculations (~4 chars per token)
  const originalChars = totalHistoryChars + currentMsgSize + systemPromptLength;
  const compactedChars =
    digestContent.length +
    recentMessages.reduce((acc, m) => acc + estimateMessageSize(m), 0) +
    currentMsgSize +
    systemPromptLength;

  const originalTokens = Math.max(1000, Math.round(originalChars / 4));
  const compactedTokens = Math.max(500, Math.round(compactedChars / 4));

  const compactionInfo: ContextCompactionInfo = {
    originalTokens,
    compactedTokens,
    compactedMsgCount: olderMessages.length,
    digest,
  };

  return {
    messages: compactedMessages,
    compactionInfo,
  };
}
