"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("MYSPOT page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-24">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-rose-100 text-3xl">⚠️</div>
        <h1 className="mt-6 font-display text-2xl font-extrabold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-slate-500">
          We hit a snag while loading this page. Your data is safe — try again, or head back to the map.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-brand-600/30 transition hover:bg-brand-700"
          >
            Try again
          </button>
          <Link
            href="/parking"
            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
          >
            Find parking
          </Link>
        </div>
        {error.digest && <p className="mt-6 text-xs text-slate-400">Error reference: {error.digest}</p>}
      </div>
    </div>
  );
}
