"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import AuthCard, { Field } from "@/components/AuthCard";
import { AUTH } from "@/lib/i18n/pages/auth";
import { apiErrorText } from "@/lib/i18n/errors";

export default function ForgotPasswordPage() {
  const { lang } = useLang();
  const t = AUTH[lang];

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
        setError(t.serverDown);
        return;
      }
      if (!res.ok) {
        setError(apiErrorText(lang, data, t.forgotFailed));
        return;
      }
      setSentTo(email.trim());
    } catch {
      setError(t.offline);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title={t.forgotTitle}
      sub={t.forgotSub}
      footer={
        <Link href="/login" className="link-quiet inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.backToLogin}
        </Link>
      }
    >
      {sentTo ? (
        <div className="space-y-4">
          <div role="status" className="flex items-start gap-2 rounded-md border-2 border-leaf-600/40 bg-leaf-50 p-3 text-sm text-leaf-800">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {t.sentBefore} <b>{sentTo}</b> {t.sentAfter}
            </span>
          </div>
          <p className="text-sm text-ink-500">{t.sentHint}</p>
          <button type="button" onClick={() => setSentTo(null)} className="btn btn-ghost w-full">
            {t.sendAgain}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field icon={<Mail className="h-3.5 w-3.5" />} label={t.forgotEmail}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input border-2"
              autoComplete="email"
            />
          </Field>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-md border-2 border-stamp-500/40 bg-rose-50 p-3 text-sm text-stamp-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary w-full py-3">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.forgotSending}
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" strokeWidth={2.5} />
                {t.forgotSend}
              </>
            )}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
