import { Reveal } from "@/components/motion/Motion";

/** Kraft tag that frames the login and sign-up forms. */
export default function AuthCard({
  title,
  sub,
  children,
  footer,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-220px)] max-w-md flex-col justify-center px-5 py-12 sm:px-8">
      <Reveal y={30} className="stitch relative rounded-md bg-white p-7 shadow-soft sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-leaf-700 font-stamp text-lg text-paper shadow-[0_2px_0_0_#1F2A12]">
            S<span className="text-leaf-300">+</span>
          </span>
          <div>
            <h1 className="text-3xl uppercase leading-none text-ink-900">{title}</h1>
            <p className="mt-1 text-sm text-ink-500">{sub}</p>
          </div>
        </div>
        {children}
        <div className="mt-7 border-t-2 border-dashed border-ink-900/15 pt-5 text-center text-sm text-ink-500">{footer}</div>
      </Reveal>
    </main>
  );
}

export function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 font-display text-sm uppercase tracking-wide text-ink-700">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
