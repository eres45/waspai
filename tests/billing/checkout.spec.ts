import { test, expect } from "@playwright/test";
import { TEST_USERS } from "../constants/test-users";
import * as crypto from "crypto";

test.describe("Razorpay Subscription Flow E2E", () => {
  test("should complete the checkout flow and upgrade the user to Pro", async ({
    page,
  }) => {
    // Log browser console output
    page.on("console", (msg) =>
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`),
    );

    // 1. Expose signature calculation to the page context
    await page.exposeFunction(
      "calculateSignature",
      (orderId: string, paymentId: string) => {
        const keySecret =
          process.env.RAZORPAY_KEY_SECRET || "aFwoz8pYgrF89xLrQhKP9LnO";
        const body = orderId + "|" + paymentId;
        return crypto
          .createHmac("sha256", keySecret)
          .update(body)
          .digest("hex");
      },
    );

    // 2. Perform manual login
    console.log("🔑 Logging in as regular user...");
    await page.goto("/sign-in");
    await page.locator("#email").fill(TEST_USERS.regular.email);
    await page.locator("#password").fill(TEST_USERS.regular.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    // Wait for redirection to confirm login succeeded
    await page.waitForURL(
      (url) => {
        const urlStr = url.toString();
        return !urlStr.includes("/sign-in") && !urlStr.includes("/sign-up");
      },
      { timeout: 10000 },
    );
    console.log("✅ Login successful");

    // 3. Go to the checkout page directly for "pro"
    console.log("💳 Navigating to Pro Plan checkout...");
    await page.goto("/checkout/pro");
    await page.waitForLoadState("networkidle");

    // 4. Verify we see the plan details card
    await expect(page.getByText("Pro Plan (Monthly)")).toBeVisible();
    await expect(page.getByText("₹399/mo", { exact: true })).toBeVisible();

    // 5. Inject the mock window.Razorpay SDK into the browser context
    await page.evaluate(() => {
      const MockRazorpay = function (this: any, options: any) {
        this.open = async () => {
          // Generate a fake payment ID
          const paymentId =
            "pay_test_" + Math.random().toString(36).substring(7);

          // Request signature calculation from Node.js environment
          const signature = await (window as any).calculateSignature(
            options.order_id,
            paymentId,
          );

          // Trigger the success handler callback
          await options.handler({
            razorpay_order_id: options.order_id,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
          });
        };
        this.on = () => {};
      };
      (window as any).Razorpay = MockRazorpay;
    });

    // 6. Click the Pay button
    const payButton = page.getByRole("button", { name: /Pay/i });
    await expect(payButton).toBeVisible();
    await payButton.click();

    // 7. Verify processing step is triggered
    const verifyingMessage = page.getByText("Verifying payment...");
    await expect(verifyingMessage).toBeVisible();

    // 8. Verify we successfully reach the dashboard or redirected page
    await page.waitForURL(
      (url) => {
        return (
          url.pathname === "/dashboard" ||
          url.pathname === "/chat" ||
          url.pathname === "/"
        );
      },
      { timeout: 15000 },
    );
    console.log("✅ Checkout redirects completed");

    // 9. Fetch user details API directly to verify the tier is upgraded to "pro"
    const userDetails = await page.evaluate(async () => {
      try {
        const res = await fetch("/api/user/details");
        return await res.json();
      } catch (_e) {
        return null;
      }
    });

    expect(userDetails).not.toBeNull();
    expect(userDetails.tier).toBe("pro");
    console.log("🏆 Verification successful: User upgraded to 'pro'!");
  });
});
