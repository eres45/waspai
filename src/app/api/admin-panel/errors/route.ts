import { type NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "lib/admin-panel/auth";
import { errorRepositoryRest } from "lib/db/pg/repositories/error-repository.rest";

export async function GET(request: NextRequest) {
  const adminEmail = await getAdminSession();
  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || undefined;
  const errorName = searchParams.get("errorName") || undefined;
  const method = searchParams.get("method") || undefined;

  try {
    const result = await errorRepositoryRest.selectErrors({
      page,
      limit,
      search,
      errorName,
      method,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[admin-panel errors API] GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch error logs" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminEmail = await getAdminSession();
  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, clearAll } = await request.json();

    if (clearAll) {
      await errorRepositoryRest.clearAllErrors();
      return NextResponse.json({
        message: "All error logs cleared successfully",
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Error ID is required for deletion" },
        { status: 400 },
      );
    }

    await errorRepositoryRest.deleteError(id);
    return NextResponse.json({ message: "Error log deleted successfully" });
  } catch (error: any) {
    console.error("[admin-panel errors API] DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete error logs" },
      { status: 500 },
    );
  }
}
