import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Detect subdomain routing
  const host = request.headers.get("host") ?? "";
  const allowedDomains = ["waspai.in", "localhost:3000"];
  let subdomain: string | null = null;

  for (const domain of allowedDomains) {
    if (host.endsWith(`.${domain}`)) {
      subdomain = host.slice(0, -domain.length - 1);
      break;
    }
  }

  const isInternalOrStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/site") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon" ||
    pathname === "/wasp-ai-logo.png" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt";

  if (subdomain && subdomain !== "www" && !isInternalOrStatic) {
    const rewriteUrl = new URL(`/site/${subdomain}`, request.url);
    return NextResponse.rewrite(rewriteUrl);
  }

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

  if (pathname.startsWith("/site")) {
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
    "/((?!_next/static|_next/image|favicon.ico|icon|wasp-ai-logo.png|sitemap.xml|robots.txt|dashboard-preview.gif|api/.*|auth/callback|export|sign-in|sign-up|forgot-password|reset-password|status|landing).*)",
  ],
};
