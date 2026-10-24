import { NextResponse } from "next/server";
import { verifyCredentials, setSessionCookie, toPublic } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`login:${ip}`, { max: 10, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in a minute.", code: "rate_limited" },
      { status: 429 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON", code: "invalid_json" }, { status: 400 });
  }
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json(
      { error: "email & password required", code: "missing_fields" },
      { status: 400 },
    );
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password", code: "bad_credentials" },
      { status: 401 },
    );
  }
  await setSessionCookie(user.id);
  return NextResponse.json({ user: toPublic(user) });
}
