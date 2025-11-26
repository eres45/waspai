import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import logger from "logger";
import { updateUserDetails } from "lib/user/server";
import { getUser } from "lib/user/server";

export async function PUT(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Update user image in database
    await updateUserDetails(session.user.id, undefined, undefined, image);

    // Get updated user
    const user = await getUser(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
      message: "Profile photo updated successfully",
    });
  } catch (error) {
    logger.error("Error updating user image:", error);
    return NextResponse.json(
      { error: "Failed to update profile photo" },
      { status: 500 },
    );
  }
}
