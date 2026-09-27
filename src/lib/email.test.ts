import { describe, expect, it } from "vitest";
import { sendAdminCustomEmail } from "./email";

describe("Admin Custom Email Dispatcher", () => {
  it("rejects when no valid email recipients are provided", async () => {
    const result = await sendAdminCustomEmail({
      to: "not-an-email",
      subject: "Test Subject",
      text: "Hello World",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("No valid recipient");
  });

  it("handles valid email and logs mock or sends through Resend API", async () => {
    const result = await sendAdminCustomEmail({
      to: "admin@waspai.in",
      subject: "System Health Alert",
      text: "Fleet is operational.",
    });
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.id).toBeDefined();
  });

  it("supports array of multiple recipients", async () => {
    const result = await sendAdminCustomEmail({
      to: ["admin1@waspai.in", "admin2@waspai.in"],
      subject: "Broadcast Notice",
      text: "Scheduled maintenance tomorrow.",
    });
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
  });
});
