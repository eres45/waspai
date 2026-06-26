import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAuth } from "@/lib/auth/supabase-auth";
import { supabaseRest } from "@/lib/db/supabase-rest";

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
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      // 1. Update user tier in web database
      const { error: tierError } = await supabaseRest
        .from("user")
        .update({ tier: plan })
        .eq("id", user.id);

      if (tierError) {
        console.error("Failed to update user tier:", tierError);
      }

      // 2. Update mobile app settings
      const { error: settingsError } = await supabaseRest
        .from("wasp_user_settings")
        .update({ is_premium: true })
        .eq("user_id", user.id);

      if (settingsError) {
        console.error("Failed to update mobile user settings:", settingsError);
      }

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
