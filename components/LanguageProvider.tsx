"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DICTS, LANG_COOKIE, type Dict, type Lang } from "@/lib/i18n/dict";

/**
 * Holds the RU/EN choice. The server renders with the language from the
 * cookie (lib/i18n/server.ts); switching rewrites the cookie and refreshes
 * so server components re-render in the new language too.
 */

type LanguageContextValue = {
  lang: Lang;
  t: Dict;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback(
    (next: Lang) => {
      if (next === lang) return;
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      setLangState(next);
      router.refresh();
    },
    [lang, router],
  );

  const value = useMemo(() => ({ lang, t: DICTS[lang], setLang }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}

export function LangSwitch({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const { lang, setLang, t } = useLang();
  const dark = tone === "dark";
  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={`inline-flex items-center font-mono text-[11px] ${className}`}
    >
      {(["ru", "en"] as const).map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className={dark ? "px-1 text-paper/30" : "px-1 text-ink-300"}>/</span>}
          <button
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={`rounded-sm px-1.5 py-0.5 uppercase transition-colors ${
              lang === l
                ? dark ? "bg-amber-100 text-ink-900" : "bg-ink-900 text-paper"
                : dark ? "text-paper/60 hover:text-paper" : "text-ink-500 hover:text-ink-900"
            }`}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}
