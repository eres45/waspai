import { Resend } from "resend";
import { getWelcomeEmailHtml } from "./email-templates/welcome";
import logger from "@/lib/logger";

const resendApiKey = process.env.RESEND_API_KEY;
let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance) {
    if (!resendApiKey) {
      logger.warn(
        "RESEND_API_KEY environment variable is not set. Welcome email sending will be skipped / logged to console.",
      );
      return null;
    }
    resendInstance = new Resend(resendApiKey);
  }
  return resendInstance;
}

export async function sendWelcomeEmail(email: string, userName: string) {
  try {
    logger.info(`Attempting to send welcome email to: ${email} (${userName})`);
    const resend = getResend();
    const html = getWelcomeEmailHtml(userName);

    if (!resend) {
      logger.info(
        "[RESEND MOCK] Welcome email logged to console since RESEND_API_KEY is not set:",
      );
      logger.info(`To: ${email}`);
      logger.info("Subject: Welcome to WaspAI");
      return { mock: true, success: true };
    }

    const fromAddress =
      process.env.WELCOME_EMAIL_FROM || "WaspAI <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "Welcome to WaspAI",
      html: html,
    });

    if (error) {
      logger.error("Resend welcome email failed:", error);
      throw error;
    }

    logger.info(`Welcome email sent successfully to ${email}. ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (error) {
    logger.error("Error sending welcome email:", error);
    // Don't crash the signup flow if email fails, but return success: false
    return { success: false, error };
  }
}
