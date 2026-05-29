import { Resend } from "resend";
import { getWelcomeEmailHtml } from "./email-templates/welcome";
import logger from "@/lib/logger";

const resendApiKeys = process.env.RESEND_API_KEY
  ? process.env.RESEND_API_KEY.split(",")
      .map((k) => k.trim())
      .filter(Boolean)
  : [];

export async function sendWelcomeEmail(email: string, userName: string) {
  try {
    logger.info(`Attempting to send welcome email to: ${email} (${userName})`);
    const html = getWelcomeEmailHtml(userName);

    if (resendApiKeys.length === 0) {
      logger.warn(
        "RESEND_API_KEY environment variable is not set. Welcome email sending will be skipped / logged to console.",
      );
      logger.info(
        "[RESEND MOCK] Welcome email logged to console since RESEND_API_KEY is not set:",
      );
      logger.info(`To: ${email}`);
      logger.info("Subject: Welcome to WaspAI");
      return { mock: true, success: true };
    }

    const fromAddress =
      process.env.WELCOME_EMAIL_FROM || "WaspAI <welcome@waspai.in>";

    let lastError: any = null;

    // Rotate through keys in case of failure (failover rotation)
    for (let i = 0; i < resendApiKeys.length; i++) {
      const apiKey = resendApiKeys[i];
      try {
        logger.info(`Trying to send welcome email using key #${i + 1}...`);
        const resend = new Resend(apiKey);

        const { data, error } = await resend.emails.send({
          from: fromAddress,
          to: email,
          subject: "Welcome to WaspAI",
          html: html,
        });

        if (error) {
          logger.error(`Resend welcome email failed for key #${i + 1}:`, error);
          throw error;
        }

        logger.info(
          `Welcome email sent successfully to ${email} using key #${i + 1}. ID: ${data?.id}`,
        );
        return { success: true, id: data?.id };
      } catch (err) {
        lastError = err;
        logger.warn(
          `Key #${i + 1} failed. Retrying with next key if available...`,
        );
      }
    }

    // If we get here, all keys failed
    logger.error("All Resend API keys failed to send the email.");
    throw lastError || new Error("All Resend API keys failed");
  } catch (error) {
    logger.error("Error sending welcome email:", error);
    // Don't crash the signup flow if email fails, but return success: false
    return { success: false, error };
  }
}
