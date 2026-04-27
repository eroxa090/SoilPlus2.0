import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight auth gate for device-owner pages.
 *
 * We don't decode/verify the session here (middleware runs on the edge and
 * our HMAC helpers are Node-only). We just bounce anonymous visitors to
 * /login. The actual `deviceOwner` check happens server-side inside the
 * gated pages by calling getSessionUser() — that's where a counterfeit
 * cookie would fail.
 */

const GATED = [
  "/dashboard",
  "/irrigation",
  "/chat",
  "/connect",
];

const ADMIN = ["/admin"];

const SESSION_COOKIE = "soilplus_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isGated = GATED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAdmin = ADMIN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isGated && !isAdmin) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/irrigation/:path*",
    "/chat/:path*",
    "/connect/:path*",
    "/admin/:path*",
  ],
};
