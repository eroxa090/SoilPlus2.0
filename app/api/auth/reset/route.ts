import { NextResponse } from "next/server";
import { resetPasswordWithToken, setSessionCookie, toPublic } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`reset:${ip}`, { max: 10, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через минуту." },
      { status: 429 },
    );
  }

  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { token, password } = body;
  if (!token || !password) {
    return NextResponse.json({ error: "token & password required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Пароль должен быть не короче 8 символов." },
      { status: 400 },
    );
  }

  try {
    const user = await resetPasswordWithToken(token, password);
    if (!user) {
      return NextResponse.json(
        { error: "Ссылка недействительна или устарела. Запросите новую." },
        { status: 400 },
      );
    }
    await setSessionCookie(user.id);
    return NextResponse.json({ user: toPublic(user) });
  } catch (e) {
    console.error("[password-reset] reset failed:", e);
    return NextResponse.json(
      { error: "Не удалось сменить пароль. Попробуйте позже." },
      { status: 500 },
    );
  }
}
