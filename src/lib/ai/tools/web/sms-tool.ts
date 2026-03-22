import { tool as createTool } from "ai";
import { z } from "zod";
import { SMSService } from "./sms-service";

/**
 * list-sms-numbers: Get available temporary phone numbers
 */
export const listSmsNumbersTool = createTool({
  name: "list-sms-numbers",
  description:
    "Get a list of available temporary phone numbers for a specific country (e.g., 'UK', 'US', 'Algeria').",
  inputSchema: z.object({
    country: z
      .string()
      .optional()
      .describe("Filter by country name (optional)"),
  }),
  execute: async ({ country }) => {
    try {
      const numbers = await SMSService.listNumbers(country);

      if (numbers.length === 0) {
        return country
          ? `No active numbers found for ${country} at the moment. Try a broader search or another country.`
          : "No active numbers found. Service might be temporarily busy.";
      }

      return {
        count: numbers.length,
        numbers: numbers.slice(0, 15).map((n) => ({
          number: n.number,
          country: n.country,
          provider: n.provider,
        })),
        message: `Found ${numbers.length} numbers. Choose one and use 'get-sms-messages' to check for your code.`,
      };
    } catch (error: any) {
      return `Failed to list numbers: ${error.message}`;
    }
  },
});

/**
 * get-sms-messages: Check for incoming SMS messages on a number
 */
export const getSmsMessagesTool = createTool({
  name: "get-sms-messages",
  description:
    "Check for new incoming SMS messages (like OTP / Verification codes) on a specific phone number.",
  inputSchema: z.object({
    number: z
      .string()
      .describe("The phone number to check (e.g., '+447475352330')"),
    country: z
      .string()
      .optional()
      .default("United Kingdom")
      .describe("The country for the number (e.g., 'UK', 'US')"),
    provider: z
      .enum(["smss.net", "smss.biz"])
      .optional()
      .describe("The provider for the number (defaults to smss.net)"),
  }),
  execute: async ({ number, country, provider }) => {
    try {
      const messages = await SMSService.getMessages(
        number,
        provider || "smss.net",
        country,
      );

      if (messages.length === 0) {
        return `No messages found for ${number} yet. Please wait another minute and try again.`;
      }

      // Proactively extract potential codes for the LLM
      return {
        count: messages.length,
        messages: messages.map((m) => ({
          from: m.from,
          text: m.text,
          date: m.date,
        })),
        instructions:
          "Look for 4-8 digit numeric codes in the 'text' field. If found, report the code clearly to the user.",
      };
    } catch (error: any) {
      return `Failed to fetch messages: ${error.message}`;
    }
  },
});
