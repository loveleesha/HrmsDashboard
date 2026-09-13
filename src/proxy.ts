import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, isJwtShaped } from "@/services/auth.service";

const AUTH_ROUTES = ["/login", "/forgot-password", "/otp", "/reset-password"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  // Only a JWT counts as a session now. Anyone still carrying the old
  // pre-rewrite cookie (a plain email string, from before real auth was
  // wired in) gets treated as signed out here and the stale cookie is
  // dropped, rather than being waved through on a value that was never a
  // real token.
  const hasSession = Boolean(cookieValue && isJwtShaped(cookieValue));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!hasSession && !isAuthRoute) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (cookieValue) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
