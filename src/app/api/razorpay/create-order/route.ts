import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSessionCookie } from "better-auth/cookies";

// Initialize Razorpay
// Using environment variables for security, but allow fallback for the user provided keys if env vars are missing
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_S4wK1foeOjf3GH",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "aFwoz8pYgrF89xLrQhKP9LnO",
});

const SUBSCRIPTION_PLANS = {
  pro: {
    monthly: { amount: 83000, currency: "INR" }, // 830 INR in paise
    annual: { amount: 830000, currency: "INR" },
  },
  ultra: {
    monthly: { amount: 266000, currency: "INR" },
    annual: { amount: 2660000, currency: "INR" },
  },
};

export async function POST(req: NextRequest) {
  try {
    const session = getSessionCookie(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, period = "monthly" } = await req.json();

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
