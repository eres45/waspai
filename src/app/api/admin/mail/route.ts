import { NextRequest, NextResponse } from "next/server";
import { hasAdminPermission } from "@/lib/auth/permissions";
import { sendAdminCustomEmail } from "@/lib/email";
import { pgDb as db } from "lib/db/pg/db.pg";
import { UserTable } from "lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await hasAdminPermission();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required." },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { to, subject, message, html, senderName } = body;

    if (!to || (typeof to !== "string" && !Array.isArray(to))) {
      return NextResponse.json(
        { error: "Recipient ('to') is required." },
        { status: 400 },
      );
    }

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json(
        { error: "Subject is required." },
        { status: 400 },
      );
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message content is required." },
        { status: 400 },
      );
    }

    let recipientList: string[] = [];

    if (to === "team" || to === "admins") {
      // Fetch all team admins from database
      const adminUsers = await db
        .select({ email: UserTable.email })
        .from(UserTable)
        .where(eq(UserTable.role, "admin"));
      recipientList = adminUsers.map((u) => u.email).filter(Boolean);
    } else if (to === "pro" || to === "subscribers") {
      // Fetch all pro users from database
      const proUsers = await db
        .select({ email: UserTable.email })
        .from(UserTable)
        .where(eq(UserTable.tier, "pro"));
      recipientList = proUsers.map((u) => u.email).filter(Boolean);
    } else if (Array.isArray(to)) {
      recipientList = to.map((e) => String(e).trim()).filter(Boolean);
    } else {
      // Comma-separated or single email
      recipientList = to
        .split(/[,\s]+/)
        .map((e: string) => e.trim())
        .filter((e: string) => e.length > 0 && e.includes("@"));
    }

    if (recipientList.length === 0) {
      return NextResponse.json(
        { error: "No valid recipient email addresses found." },
        { status: 400 },
      );
    }

    const result = await sendAdminCustomEmail({
      to: recipientList,
      subject: subject.trim(),
      text: message.trim(),
      html: html || undefined,
      senderName: senderName || "WaspAI Administration",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to dispatch email." },
        { status: 500 },
      );
    }

    logger.info(
      `[AdminMailAPI] Dispatched email to ${recipientList.length} recipients: ${subject}`,
    );

    return NextResponse.json({
      success: true,
      recipientsCount: recipientList.length,
      recipients: recipientList.slice(0, 5),
      id: result.id,
      mock: result.mock ?? false,
      message: `Email successfully dispatched to ${recipientList.length} recipient${recipientList.length > 1 ? "s" : ""}.`,
    });
  } catch (error) {
    logger.error("[AdminMailAPI] Unexpected error in mail dispatch:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
