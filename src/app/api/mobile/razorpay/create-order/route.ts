import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { supabaseAuth } from "@/lib/auth/supabase-auth";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_S4wK1foeOjf3GH",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "aFwoz8pYgrF89xLrQhKP9LnO",
});

const SUBSCRIPTION_PLANS = {
  pro: {
    monthly: { amount: 39900, currency: "INR" }, // 399 INR in paise
    annual: { amount: 399000, currency: "INR" }, // 3,990 INR in paise
  },
  ultra: {
    monthly: { amount: 99900, currency: "INR" }, // 999 INR in paise
    annual: { amount: 999000, currency: "INR" }, // 9,990 INR in paise
  },
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
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
        userId: user.id,
      },
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json(order);
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
