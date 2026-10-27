import { NextResponse } from "next/server";
import { resetPasswordWithToken, setSessionCookie, toPublic } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`reset:${ip}`, { max: 10, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через минуту.", code: "rate_limited" },
      { status: 429 },
    );
  }

  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON", code: "invalid_json" }, { status: 400 });
  }
  const { token, password } = body;
  if (!token || !password) {
    return NextResponse.json({ error: "token & password required", code: "missing_fields" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Пароль должен быть не короче 8 символов.", code: "short_password" },
      { status: 400 },
    );
  }

  try {
    const user = await resetPasswordWithToken(token, password);
    if (!user) {
      return NextResponse.json(
        { error: "Ссылка недействительна или устарела. Запросите новую.", code: "reset_expired" },
        { status: 400 },
      );
    }
    await setSessionCookie(user.id);
    return NextResponse.json({ user: toPublic(user) });
  } catch (e) {
    console.error("[password-reset] reset failed:", e);
    return NextResponse.json(
      { error: "Не удалось сменить пароль. Попробуйте позже.", code: "reset_failed" },
      { status: 500 },
    );
  }
}
