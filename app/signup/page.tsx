"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AlertTriangle, Loader2, Lock, Mail, User as UserIcon, UserPlus } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useLang } from "@/components/LanguageProvider";
import AuthCard, { Field } from "@/components/AuthCard";
import { AUTH } from "@/lib/i18n/pages/auth";
import { apiErrorText } from "@/lib/i18n/errors";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  );
}

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();
  // Only same-site paths: "?next=https://evil.example" or "//evil" must not
  // turn the login into an open redirect.
  const rawNext = params.get("next") ?? "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")
    ? rawNext
    : "/profile";
  const { refresh } = useUser();
  const { lang } = useLang();
  const t = AUTH[lang];

  const [name, setName] = useState("");
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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(apiErrorText(lang, data, t.signupFailed));
        return;
      }
      await refresh();
      router.push(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.network);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title={t.signupTitle}
      sub={t.signupSub}
      footer={
        <>
          {t.haveAccount}{" "}
          <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="link-quiet text-sm">
            {t.toLogin}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field icon={<UserIcon className="h-3.5 w-3.5" />} label={t.name}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            className="input border-2"
            autoComplete="name"
          />
        </Field>
        <Field icon={<Mail className="h-3.5 w-3.5" />} label={t.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input border-2"
            autoComplete="email"
          />
        </Field>
        <Field icon={<Lock className="h-3.5 w-3.5" />} label={t.passwordNew}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="input border-2"
            autoComplete="new-password"
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
              {t.signingUp}
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" strokeWidth={2.5} />
              {t.signup}
            </>
          )}
        </button>

        <p className="text-[11px] leading-snug text-ink-500">{t.privacy}</p>
      </form>
    </AuthCard>
  );
}
