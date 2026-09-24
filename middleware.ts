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

/**
 * Public on purpose: /connect, /chat and /irrigation. They hold no personal
 * data — the device stream is a direct browser↔ESP32 WebSocket and the
 * calculators are pure functions — so gating them only cost us visitors who
 * bounced at the login wall. It also keeps the live device demo working when
 * the database is asleep, since none of the three touches Supabase.
 */
const GATED = [
  "/dashboard",
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
    "/admin/:path*",
  ],
};
