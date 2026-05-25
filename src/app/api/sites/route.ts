import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { siteRepository } from "lib/db/repository";
import { z } from "zod";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sites = await siteRepository.listSitesByUser(session.user.id);
    return NextResponse.json(sites);
  } catch (error) {
    console.error("[Sites API] GET list error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

const DeleteSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = DeleteSchema.parse(body);

    const success = await siteRepository.deleteSite(id, session.user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Site not found or not owned by you" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 },
      );
    }
    console.error("[Sites API] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
