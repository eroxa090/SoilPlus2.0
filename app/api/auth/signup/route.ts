import { NextResponse } from "next/server";
import { createUser, setSessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`signup:${ip}`, { max: 5, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many signups. Try again in a minute." }, { status: 429 });
  }

  let body: { email?: string; name?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { email, name, password } = body;
  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "email, name, password are required" },
      { status: 400 },
    );
  }

  try {
    const user = await createUser({ email, name, password });
    await setSessionCookie(user.id);
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Signup failed" },
      { status: 400 },
    );
  }
}
