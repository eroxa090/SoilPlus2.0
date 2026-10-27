"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, Loader2, Mail, MailCheck, Sprout } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (!data) {
        setError("Сервер недоступен. Попробуйте чуть позже.");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Не удалось отправить письмо.");
        return;
      }
      setSentTo(email.trim());
    } catch {
      setError("Нет связи с сервером. Проверьте интернет.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col justify-center px-5 py-10 sm:px-8">
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-600">
            <Sprout className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-900">
              Восстановление пароля
            </h1>
            <p className="text-xs text-ink-500">Пришлём ссылку для нового пароля</p>
          </div>
        </div>

        {sentTo ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-leaf-200 bg-leaf-50 p-3 text-sm text-leaf-800">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Если аккаунт с адресом <b>{sentTo}</b> существует, мы отправили на него
                письмо со ссылкой. Ссылка действует 1 час.
              </span>
            </div>
            <p className="text-sm text-ink-500">
              Письма нет через пару минут — проверьте папку «Спам» или запросите ещё раз.
            </p>
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="btn btn-ghost w-full"
            >
              Отправить ещё раз
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-700">
                <Mail className="h-3.5 w-3.5" />
                Email, с которым вы регистрировались
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                autoComplete="email"
              />
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={busy} className="btn btn-primary w-full">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Отправляем…
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Отправить ссылку
                </>
              )}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-ink-600">
          <Link href="/login" className="inline-flex items-center gap-1 font-medium text-leaf-700 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Вернуться ко входу
          </Link>
        </p>
      </div>
    </main>
  );
}
