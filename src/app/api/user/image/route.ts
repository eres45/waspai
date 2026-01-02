import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import logger from "@/lib/logger";
import { updateUserDetails } from "lib/user/server";
import { getUser } from "lib/user/server";

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    console.log(
      "[Image API] Session:",
      session?.user?.id ? "authenticated" : "not authenticated",
    );

    if (!session?.user?.id) {
      console.log("[Image API] No session user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { image } = await request.json();
    console.log("[Image API] Image size:", image ? image.length : 0, "bytes");

    if (!image) {
      console.log("[Image API] No image provided");
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Update user image in database
    console.log("[Image API] Updating user image for:", session.user.id);
    await updateUserDetails(session.user.id, undefined, undefined, image);
    console.log("[Image API] Image updated successfully");

    // Get updated user
    const user = await getUser(session.user.id);
    console.log(
      "[Image API] Retrieved user:",
      user?.id,
      "image:",
      user?.image ? "yes" : "no",
    );

    if (!user) {
      console.log("[Image API] User not found after update");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
      message: "Profile photo updated successfully",
    });
  } catch (error) {
    console.error("[Image API] Error:", error);
    logger.error("Error updating user image:", error);
    return NextResponse.json(
      {
        error: "Failed to update profile photo",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
