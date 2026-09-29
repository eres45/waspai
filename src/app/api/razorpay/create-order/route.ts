import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSessionCookie } from "better-auth/cookies";

// Initialize Razorpay
// Using environment variables for security, but allow fallback for the user provided keys if env vars are missing
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_S4wK1foeOjf3GH",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "aFwoz8pYgrF89xLrQhKP9LnO",
});

const MAX_PLAN_CONFIG = {
  monthly: { amount: 99900, currency: "INR" }, // 999 INR in paise
  annual: { amount: 999000, currency: "INR" }, // 9,990 INR in paise
};

const SUBSCRIPTION_PLANS = {
  pro: {
    monthly: { amount: 39900, currency: "INR" }, // 399 INR in paise
    annual: { amount: 399000, currency: "INR" }, // 3,990 INR in paise
  },
  max: MAX_PLAN_CONFIG,
  ultra: MAX_PLAN_CONFIG,
};

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    console.log("[DEBUG API create-order] Request body text:", bodyText);

    const session = getSessionCookie(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, period = "monthly" } = bodyText ? JSON.parse(bodyText) : {};

    if (!plan || !SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planDetails =
      SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS][
        period as "monthly" | "annual"
      ];

    const options = {
      amount: planDetails.amount,
      currency: planDetails.currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        plan,
        period,
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_live_S4wK1foeOjf3GH", // Send key to client
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json(
      { error: "Error creating order" },
      { status: 500 },
    );
  }
}
