import { NextResponse } from "next/server";
import { createPasswordResetToken, findUserByEmail } from "@/lib/auth";
import { mailConfigured, sendPasswordResetEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where reset links point. A configured APP_URL wins; on Vercel the stable
 * production domain is next. The request's own origin is only a dev
 * fallback — trusting the Host header in production would let anyone make
 * the emailed link point at a domain they control.
 */
function appOrigin(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`forgot:${ip}`, { max: 5, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте через минуту." },
      { status: 429 },
    );
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: "Введите корректный email." }, { status: 400 });
  }

  // Answer the same way whether or not the account exists, so this form
  // can't be used to find out who is registered.
  if (process.env.NODE_ENV === "production" && !mailConfigured()) {
    return NextResponse.json(
      { error: "Восстановление по почте пока не настроено. Напишите администратору." },
      { status: 503 },
    );
  }
  if (!rateLimit(`forgot-email:${email}`, { max: 3, windowMs: 15 * 60_000 })) {
    return NextResponse.json({ ok: true });
  }

  try {
    const user = await findUserByEmail(email);
    if (user) {
      const token = createPasswordResetToken(user);
      const link = `${appOrigin(req)}/reset-password?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail(user.email, link);
    }
  } catch (e) {
    console.error("[password-reset] forgot failed:", e);
    return NextResponse.json(
      { error: "Не удалось отправить письмо. Попробуйте позже." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
