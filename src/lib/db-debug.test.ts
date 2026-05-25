import dotenv from "dotenv";
dotenv.config();

import { describe, it, vi } from "vitest";
import { pgDb as db } from "./db/pg/db.pg";
import { ChatMessageTable } from "./db/pg/schema.pg";
import { eq, sql } from "drizzle-orm";

vi.mock("server-only", () => ({}));

describe("db debug", () => {
  it("should inspect thread messages", async () => {
    // Find the message
    const messages = await db
      .select()
      .from(ChatMessageTable)
      .where(sql`parts::text ILIKE '%heyo my %'`);

    console.log("Found matching messages:", messages.length);
    for (const msg of messages) {
      console.log(
        `Message ID: ${msg.id}, Thread ID: ${msg.threadId}, Role: ${msg.role}, CreatedAt: ${msg.createdAt}`,
      );

      // Load all messages in this thread
      const threadMsgs = await db
        .select()
        .from(ChatMessageTable)
        .where(eq(ChatMessageTable.threadId, msg.threadId))
        .orderBy(ChatMessageTable.createdAt);

      console.log(
        `--- Messages in thread ${msg.threadId} (Ordered by createdAt) ---`,
      );
      for (const tMsg of threadMsgs) {
        console.log(
          `ID: ${tMsg.id}, Role: ${tMsg.role}, CreatedAt: ${tMsg.createdAt}, Parts: ${JSON.stringify(tMsg.parts)}`,
        );
      }
    }
  });
});
