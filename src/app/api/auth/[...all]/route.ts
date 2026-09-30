import { auth, getSession } from "auth/server";
import { toNextJsHandler } from "better-auth/next-js";
import { type NextRequest, NextResponse } from "next/server";

const handlers = toNextJsHandler(auth.handler);

export const POST = handlers.POST;

export async function GET(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.endsWith("/get-session") || pathname.endsWith("/session")) {
    try {
      const session = await getSession();
      if (session?.user) {
        return NextResponse.json({
          user: session.user,
          session: {
            id: session.session?.token || "session-token",
            userId: session.user.id,
            expiresAt: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            token: session.session?.token || "session-token",
          },
        });
      }
    } catch (e) {
      console.error("[auth/get-session] Error getting session:", e);
    }
  }

  return handlers.GET(request);
}
