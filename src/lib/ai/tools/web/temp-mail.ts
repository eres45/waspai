import { tool as createTool } from "ai";
import { z } from "zod";
import { TempMailService, TempMailMessage } from "./temp-mail-service";

/**
 * create-temp-email: Create a temporary email address
 */
export const createTempEmailTool = createTool({
  name: "create-temp-email",
  description:
    "Create a temporary/disposable email address. Default is Mail.tm (human-readable), with backups like 1secmail, guerrillamail, or maildrop.cc.",
  inputSchema: z.object({
    provider: z
      .enum(["mail.tm", "1secmail", "guerrillamail", "maildrop.cc"])
      .optional()
      .describe("Choose a provider. Default is mail.tm."),
  }),
  execute: async ({ provider = "mail.tm" }) => {
    try {
      let account;
      switch (provider) {
        case "mail.tm":
          account = await TempMailService.createMailTmAccount();
          break;
        case "1secmail":
          account = await TempMailService.create1SecMailAccount();
          break;
        case "guerrillamail":
          account = await TempMailService.createGuerrillaMailAccount();
          break;
        case "maildrop.cc":
          // Maildrop doesn't have a "create" API, just pick a random name
          const name = Math.random().toString(36).substring(2, 10);
          account = { email: `${name}@maildrop.cc`, provider: "maildrop.cc" };
          break;
        default:
          throw new Error("Invalid provider");
      }

      return {
        ...account,
        message: `Created temporary email using ${provider}: ${account.email}. Use 'get-temp-email-messages' to check for mail.`,
      };
    } catch (error: any) {
      return `Failed to create temporary email: ${error.message}`;
    }
  },
});

/**
 * get-temp-email-messages: List messages for a given email
 */
export const getTempEmailMessagesTool = createTool({
  name: "get-temp-email-messages",
  description: "Check for new messages in a temporary email inbox.",
  inputSchema: z.object({
    email: z.string().describe("The temporary email address to check"),
    provider: z
      .enum(["mail.tm", "1secmail", "guerrillamail", "maildrop.cc"])
      .describe("The provider used to create this email"),
    password: z
      .string()
      .optional()
      .describe("Account password (required for mail.tm)"),
    token: z.string().optional().describe("Account token (if available)"),
  }),
  execute: async ({ email, provider, password, token }) => {
    try {
      let messages: TempMailMessage[] = [];
      switch (provider) {
        case "mail.tm":
          messages = await TempMailService.getMailTmMessages({
            email,
            provider,
            password,
            token,
          });
          break;
        case "1secmail":
          messages = await TempMailService.get1SecMailMessages(email);
          break;
        case "guerrillamail":
          // For Guerrilla Mail, we ideally need the token (SID)
          if (!token)
            throw new Error(
              "Guerrilla Mail requires a token (SID) to check messages.",
            );
          messages = await TempMailService.getGuerrillaMailMessages(token);
          break;
        case "maildrop.cc":
          messages = await TempMailService.getMaildropMessages(email);
          break;
        default:
          throw new Error("Invalid provider");
      }

      if (messages.length === 0) {
        return "No messages found in this inbox yet.";
      }

      return {
        count: messages.length,
        messages: messages.map((m) => ({
          from: m.from,
          subject: m.subject,
          text: m.text,
          html: m.html,
          date: m.date,
        })),
      };
    } catch (error: any) {
      return `Failed to fetch messages: ${error.message}`;
    }
  },
});
