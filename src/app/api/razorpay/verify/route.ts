import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "auth/server";
import { supabaseRest } from "lib/db/supabase-rest";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { plan, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan is required for verification" },
        { status: 400 },
      );
    }

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || "aFwoz8pYgrF89xLrQhKP9LnO";

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Payment verification successful
      const session = await getSession();
      if (session?.user?.id) {
        // Update user tier in database using HTTP REST client
        await supabaseRest
          .from("user")
          .update({ tier: plan })
          .eq("id", session.user.id);

        // Update local session cookie for instant client synchronization
        const cookieStore = await cookies();
        const enrichedUser = {
          ...session.user,
          tier: plan,
        };

        cookieStore.set("auth-user", JSON.stringify(enrichedUser), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json(
      { error: "Error verifying payment" },
      { status: 500 },
    );
  }
}
