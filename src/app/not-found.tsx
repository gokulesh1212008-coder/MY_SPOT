import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-slate-950 px-4 py-24 text-white">
      <div className="absolute -left-24 top-10 size-80 rounded-full bg-brand-600/30 blur-[110px] animate-float" />
      <div className="absolute -right-24 bottom-10 size-80 rounded-full bg-violet-600/30 blur-[110px] animate-float-slow" />
      <div className="relative mx-auto max-w-xl text-center">
        <div className="font-display text-8xl font-extrabold leading-none text-gradient sm:text-9xl">404</div>
        <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight">
          This parking space doesn&apos;t exist
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          The page you&apos;re looking for was moved, booked out, or never parked here.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/parking"
            className="rounded-2xl bg-brand-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-brand-600/40 transition-all hover:-translate-y-0.5 hover:bg-brand-500"
          >
            Find parking
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/10"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
