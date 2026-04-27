"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  AlertTriangle,
  LogIn,
  Loader2,
  Mail,
  Lock,
  Sprout,
} from "lucide-react";
import { useUser } from "@/components/UserProvider";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/profile";
  const { refresh } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Не удалось войти.");
        return;
      }
      await refresh();
      router.push(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Сетевая ошибка");
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
              Вход
            </h1>
            <p className="text-xs text-ink-500">
              Добро пожаловать обратно в SoilPlus
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-700">
              <Mail className="h-3.5 w-3.5" />
              Email
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
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-700">
              <Lock className="h-3.5 w-3.5" />
              Пароль
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="input"
              autoComplete="current-password"
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
                Входим…
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Войти
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-600">
          Нет аккаунта?{" "}
          <Link
            href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-leaf-700 hover:underline"
          >
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </main>
  );
}
