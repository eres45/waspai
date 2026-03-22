import { tool as createTool } from "ai";
import { z } from "zod";

const BASE_URL = "https://socialdown.itz-ashlynn.workers.dev";

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
