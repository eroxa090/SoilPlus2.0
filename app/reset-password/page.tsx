"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AlertTriangle, KeyRound, Loader2, Lock, Sprout } from "lucide-react";
import { useUser } from "@/components/UserProvider";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const { refresh } = useUser();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) {
      setError("Пароль должен быть не короче 8 символов.");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => null);
      if (!data) {
        setError("Сервер недоступен. Попробуйте чуть позже.");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Не удалось сменить пароль.");
        return;
      }
      await refresh();
      router.push("/profile");
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
            <h1 className="font-display text-xl font-semibold text-ink-900">Новый пароль</h1>
            <p className="text-xs text-ink-500">После смены вы сразу войдёте в аккаунт</p>
          </div>
        </div>

        {!token ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>В ссылке нет кода восстановления. Откройте ссылку из письма целиком.</span>
            </div>
            <Link href="/forgot-password" className="btn btn-primary w-full">
              Запросить новую ссылку
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-700">
                <Lock className="h-3.5 w-3.5" />
                Новый пароль
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                required
                minLength={8}
                className="input"
                autoComplete="new-password"
              />
              <span className="mt-1 block text-xs text-ink-500">Не короче 8 символов</span>
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-700">
                <Lock className="h-3.5 w-3.5" />
                Повторите пароль
              </span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError(null);
                }}
                required
                minLength={8}
                className="input"
                autoComplete="new-password"
              />
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {error}{" "}
                  {error.includes("устарела") && (
                    <Link href="/forgot-password" className="font-medium underline">
                      Запросить новую ссылку
                    </Link>
                  )}
                </span>
              </div>
            )}

            <button type="submit" disabled={busy} className="btn btn-primary w-full">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Сохраняем…
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Сохранить пароль
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
