"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AlertTriangle, ArrowLeft, KeyRound, Loader2, Lock } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useLang } from "@/components/LanguageProvider";
import AuthCard, { Field } from "@/components/AuthCard";
import { AUTH } from "@/lib/i18n/pages/auth";
import { apiErrorText } from "@/lib/i18n/errors";

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
  const { lang } = useLang();
  const t = AUTH[lang];

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) {
      setError(t.resetShort);
      return;
    }
    if (password !== confirm) {
      setError(t.resetMismatch);
      return;
    }
    setBusy(true);
    setError(null);
    setExpired(false);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => null);
      if (!data) {
        setError(t.serverDown);
        return;
      }
      if (!res.ok) {
        setError(apiErrorText(lang, data, t.resetFailed));
        setExpired(data.code === "reset_expired");
        return;
      }
      await refresh();
      router.push("/profile");
    } catch {
      setError(t.offline);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title={t.resetTitle}
      sub={t.resetSub}
      footer={
        <Link href="/login" className="link-quiet inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.backToLogin}
        </Link>
      }
    >
      {!token ? (
        <div className="space-y-4">
          <div role="alert" className="flex items-start gap-2 rounded-md border-2 border-stamp-500/40 bg-rose-50 p-3 text-sm text-stamp-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t.resetNoToken}</span>
          </div>
          <Link href="/forgot-password" className="btn btn-primary w-full">
            {t.resetRequestNew}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field icon={<Lock className="h-3.5 w-3.5" />} label={t.resetNew}>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              required
              minLength={8}
              className="input border-2"
              autoComplete="new-password"
            />
            <span className="mt-1 block text-xs text-ink-500">{t.resetHint}</span>
          </Field>
          <Field icon={<Lock className="h-3.5 w-3.5" />} label={t.resetRepeat}>
            <input
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError(null);
              }}
              required
              minLength={8}
              className="input border-2"
              autoComplete="new-password"
            />
          </Field>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-md border-2 border-stamp-500/40 bg-rose-50 p-3 text-sm text-stamp-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {error}{" "}
                {expired && (
                  <Link href="/forgot-password" className="font-medium underline">
                    {t.resetRequestNew}
                  </Link>
                )}
              </span>
            </div>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary w-full py-3">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.resetSaving}
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" strokeWidth={2.5} />
                {t.resetSave}
              </>
            )}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
