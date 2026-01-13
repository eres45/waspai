import { tool as createTool } from "ai";
import { z } from "zod";

const BASE_URL = "https://socialdown.itz-ashlynn.workers.dev";

/**
 * TempMail: Create a temporary email address
 */
export const createTempEmailTool = createTool({
  name: "create-temp-email",
  description:
    "Create a temporary/disposable email address for the user. Useful for privacy or testing.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const res = await fetch(`${BASE_URL}/tempmail?action=create`);
      if (!res.ok) throw new Error(`API failed: ${res.status}`);
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to create email");

      return {
        email: data.email,
        uuid: data.uuid,
        message: `Created temporary email: ${data.email}. You can now check for messages using this address.`,
      };
    } catch (error: any) {
      return `Failed to create temporary email: ${error.message}`;
    }
  },
});

/**
 * TempMail: List messages for a given email
 */
export const getTempEmailMessagesTool = createTool({
  name: "get-temp-email-messages",
  description: "Check for new messages/OTPs in a temporary email inbox.",
  inputSchema: z.object({
    email: z.string().describe("The temporary email address to check"),
  }),
  execute: async ({ email }) => {
    try {
      const res = await fetch(
        `${BASE_URL}/tempmail?action=messages&email=${encodeURIComponent(email)}`,
      );
      if (!res.ok) throw new Error(`API failed: ${res.status}`);
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to fetch messages");

      if (!data.messages?.data || data.messages.data.length === 0) {
        return "No messages found in this inbox yet.";
      }

      return {
        count: data.messages.total,
        messages: data.messages.data.map((m: any) => ({
          from: m.from,
          subject: m.subject,
          text: m.text,
          date: m.date,
        })),
      };
    } catch (error: any) {
      return `Failed to fetch messages: ${error.message}`;
    }
  },
});

/**
 * SendEmail: Send an email using the worker service
 */
export const sendEmailTool = createTool({
  name: "send-email",
  description: "Send an email message to a specified recipient.",
  inputSchema: z.object({
    to: z.string().describe("Recipient email address"),
    subject: z.string().describe("Email subject line"),
    body: z.string().describe("The main content of the email"),
  }),
  execute: async ({ to, subject, body }) => {
    try {
      // Trying GET method as many of these workers prefer GET for simplicity
      // but Swagger showed /sendmail and /send-email
      const url = `${BASE_URL}/send-email?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&text=${encodeURIComponent(body)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`API failed: ${res.status}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Failed to send email");

      return `Email successfully sent to ${to}.`;
    } catch (error: any) {
      return `Failed to send email: ${error.message}`;
    }
  },
});
