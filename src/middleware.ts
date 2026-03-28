import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/users", request.url));
  }

  if (pathname === "/" || pathname === "/landing" || pathname === "") {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const response = NextResponse.next();

  // Sliding expiration: Refresh the auth-user and session cookies on each request
  // to ensure the user stays logged in for 30 days from their last activity.
  const authUser = request.cookies.get("auth-user");
  if (authUser) {
    response.cookies.set("auth-user", authUser.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  const betterAuthSession = request.cookies.get("better-auth.session_token");
  if (betterAuthSession) {
    response.cookies.set("better-auth.session_token", betterAuthSession.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|dashboard-preview.gif|api/.*|auth/callback|export|sign-in|sign-up|forgot-password|reset-password|status|landing|$).*)",
  ],
};
