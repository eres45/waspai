import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";
import { chatRepository } from "lib/db/repository";
import { getSession } from "auth/auth-instance";

/**
 * Chat Export Tool
 * Exports current chat thread as formatted text for PDF/document generation
 */
export const chatExportTool = createTool({
  name: "export-chat-messages",
  description:
    "Export all messages from the current chat thread as formatted text. Returns formatted chat history that can be used to generate PDFs or documents.",
  inputSchema: z.object({
    threadId: z.string().describe("The thread ID to export messages from"),
    format: z
      .enum(["text", "markdown"])
      .optional()
      .default("text")
      .describe("Format for the exported messages: 'text' or 'markdown'"),
  }),
  execute: async ({ threadId, format }, { abortSignal: _abortSignal }) => {
    logger.info(`Chat Export: Exporting messages from thread: ${threadId}`);

    try {
      // Get session to verify authorization
      const session = await getSession();
      if (!session) {
        throw new Error("Unauthorized: No session found");
      }

      // Check if user has access to this thread
      const hasAccess = await chatRepository.checkAccess(
        threadId,
        session.user.id,
      );
      if (!hasAccess) {
        throw new Error("Unauthorized: No access to this thread");
      }

      // Get thread details
      const thread = await chatRepository.selectThread(threadId);
      if (!thread) {
        throw new Error("Thread not found");
      }

      // Get all messages from thread
      const messages = await chatRepository.selectMessagesByThreadId(threadId);
      if (!messages || messages.length === 0) {
        return {
          success: true,
          content: "No messages in this chat yet.",
          messageCount: 0,
          guide: "The chat thread is empty. Start a conversation first.",
        };
      }

      // Format messages
      let formattedContent = "";

      if (format === "markdown") {
        formattedContent = formatAsMarkdown(
          thread.title || "Chat Export",
          messages,
        );
      } else {
        formattedContent = formatAsText(
          thread.title || "Chat Export",
          messages,
        );
      }

      logger.info(
        `Chat Export: Exported ${messages.length} messages, size: ${formattedContent.length} bytes`,
      );

      return {
        success: true,
        content: formattedContent,
        messageCount: messages.length,
        threadTitle: thread.title,
        guide: `Successfully exported ${messages.length} messages from the chat. You can now generate a PDF or document with this content.`,
      };
    } catch (error) {
      logger.error("Chat Export Error:", error);
      throw error;
    }
  },
});

/**
 * Format messages as plain text
 */
function formatAsText(title: string, messages: any[]): string {
  let text = `${title}\n`;
  text += `${"=".repeat(title.length)}\n\n`;
  text += `Exported on: ${new Date().toLocaleString()}\n`;
  text += `Total Messages: ${messages.length}\n`;
  text += `${"=".repeat(50)}\n\n`;

  for (const msg of messages) {
    const role = msg.role === "user" ? "You" : "Assistant";
    const timestamp = msg.createdAt
      ? new Date(msg.createdAt).toLocaleString()
      : "Unknown time";

    text += `[${timestamp}] ${role}:\n`;

    // Extract text content from message parts
    if (msg.parts && Array.isArray(msg.parts)) {
      for (const part of msg.parts) {
        if (typeof part === "string") {
          text += part;
        } else if (typeof part === "object" && part.type === "text") {
          text += part.text || "";
        }
      }
    } else if (typeof msg.content === "string") {
      text += msg.content;
    }

    text += "\n\n";
    text += `${"-".repeat(50)}\n\n`;
  }

  return text;
}

/**
 * Format messages as markdown
 */
function formatAsMarkdown(title: string, messages: any[]): string {
  let md = `# ${title}\n\n`;
  md += `**Exported on:** ${new Date().toLocaleString()}\n`;
  md += `**Total Messages:** ${messages.length}\n\n`;
  md += `---\n\n`;

  for (const msg of messages) {
    const role = msg.role === "user" ? "👤 You" : "🤖 Assistant";
    const timestamp = msg.createdAt
      ? new Date(msg.createdAt).toLocaleString()
      : "Unknown time";

    md += `## ${role}\n`;
    md += `*${timestamp}*\n\n`;

    // Extract text content from message parts
    if (msg.parts && Array.isArray(msg.parts)) {
      for (const part of msg.parts) {
        if (typeof part === "string") {
          md += part;
        } else if (typeof part === "object" && part.type === "text") {
          md += part.text || "";
        }
      }
    } else if (typeof msg.content === "string") {
      md += msg.content;
    }

    md += "\n\n";
    md += `---\n\n`;
  }

  return md;
}
