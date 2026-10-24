import { getLang } from "@/lib/i18n/server";

/** Shown while a route loads: the S+ stamp breathing on the paper. */
export default async function Loading() {
  const lang = await getLang();
  return (
    <main
      aria-busy="true"
      className="flex min-h-[calc(100dvh-260px)] flex-col items-center justify-center gap-5 px-5 py-16"
    >
      <span className="flex h-16 w-16 animate-breath items-center justify-center rounded-lg bg-leaf-700 font-stamp text-3xl text-paper shadow-[0_3px_0_0_#1F2A12]">
        S<span className="text-leaf-300">+</span>
      </span>
      <p role="status" className="font-display text-sm uppercase tracking-[0.2em] text-ink-500">
        {lang === "ru" ? "Загружаем…" : "Loading…"}
      </p>
    </main>
  );
}
