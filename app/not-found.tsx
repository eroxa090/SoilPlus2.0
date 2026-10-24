import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLang } from "@/lib/i18n/server";

const TEXT = {
  ru: {
    stamp: "Не найдено",
    title: "На этой грядке пусто",
    body: "Такой страницы нет: возможно, ссылка устарела или в адресе опечатка.",
    home: "На главную",
    connect: "Подключить датчик",
  },
  en: {
    stamp: "Not found",
    title: "Nothing grows in this plot",
    body: "This page doesn't exist: the link may be outdated, or the address has a typo.",
    home: "Back to home",
    connect: "Connect sensor",
  },
};

export default async function NotFound() {
  const t = TEXT[await getLang()];
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-260px)] max-w-2xl flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
      <div className="stamp h-40 w-40 -rotate-12 sm:h-48 sm:w-48">
        <span>
          <span className="block text-6xl leading-none sm:text-7xl">404</span>
          <span className="text-sm sm:text-base">{t.stamp}</span>
        </span>
      </div>
      <h1 className="mt-10 text-4xl uppercase text-ink-900 sm:text-5xl">{t.title}</h1>
      <p className="mt-4 max-w-[46ch] text-lg text-ink-500">{t.body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary group">
          {t.home}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
        </Link>
        <Link href="/connect" className="btn btn-ghost">
          {t.connect}
        </Link>
      </div>
    </main>
  );
}
