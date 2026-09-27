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
    const html = await getWelcomeEmailHtml(userName);

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

export async function sendAdminCustomEmail({
  to,
  subject,
  html,
  text,
  senderName = "WaspAI Admin",
}: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  senderName?: string;
}) {
  try {
    const rawRecipients = Array.isArray(to) ? to : [to];
    const recipients = rawRecipients
      .map((r) => r.trim())
      .filter((r) => r.length > 0 && r.includes("@"));

    if (recipients.length === 0) {
      return {
        success: false,
        error: "No valid recipient email addresses provided.",
      };
    }

    logger.info(
      `Attempting to send admin email to ${recipients.length} recipients: ${recipients.slice(0, 3).join(", ")}... Subject: "${subject}"`,
    );

    if (resendApiKeys.length === 0) {
      logger.warn(
        "RESEND_API_KEY environment variable is not set. Admin custom email will be logged to console (mock).",
      );
      logger.info(
        `[RESEND MOCK] Admin custom email logged: To: ${recipients.join(", ")} | Subject: ${subject}`,
      );
      return {
        mock: true,
        success: true,
        count: recipients.length,
        id: `mock-msg-${Date.now()}`,
      };
    }

    const fromAddress =
      process.env.ADMIN_EMAIL_FROM ||
      process.env.WELCOME_EMAIL_FROM ||
      `${senderName} <admin@waspai.in>`;

    let lastError: any = null;

    for (let i = 0; i < resendApiKeys.length; i++) {
      const apiKey = resendApiKeys[i];
      try {
        const resend = new Resend(apiKey);
        const { data, error } = await resend.emails.send({
          from: fromAddress,
          to: recipients,
          subject,
          html:
            html ||
            (text
              ? `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#18181b;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e4e4e7;border-radius:12px;">
                  <h2 style="color:#09090b;margin-bottom:16px;">${subject}</h2>
                  <div style="font-size:15px;white-space:pre-wrap;">${text}</div>
                  <hr style="margin:24px 0;border:none;border-top:1px solid #e4e4e7;"/>
                  <p style="font-size:12px;color:#71717a;">Sent by WaspAI Platform Administration</p>
                </div>`
              : "<p>No content provided</p>"),
          text: text || undefined,
        });

        if (error) {
          logger.error(`Resend admin email failed for key #${i + 1}:`, error);
          throw error;
        }

        logger.info(
          `Admin email sent successfully to ${recipients.length} recipients. ID: ${data?.id}`,
        );
        return { success: true, id: data?.id, count: recipients.length };
      } catch (err) {
        lastError = err;
        logger.warn(
          `Key #${i + 1} failed. Retrying with next key if available...`,
        );
      }
    }

    logger.error("All Resend API keys failed for admin email dispatch.");
    throw lastError || new Error("All Resend API keys failed");
  } catch (error) {
    logger.error("Error sending admin custom email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
