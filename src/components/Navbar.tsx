"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { ClientUser } from "@/lib/types";

export default function Navbar({ user }: { user: ClientUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const links = [
    { href: "/parking", label: "Find Parking" },
    ...(user ? [{ href: "/dashboard", label: "My Dashboard" }] : []),
    ...(user?.isOwner ? [{ href: "/owner", label: "Owner Panel" }] : []),
    ...(user?.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setBusy(false);
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-lg text-white shadow-md shadow-brand-600/30">
            🅿️
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight text-slate-900">
            MY<span className="text-brand-600">SPOT</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(l.href) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link
                href="/parking"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700"
              >
                Book Parking
              </Link>
              <button
                onClick={logout}
                disabled={busy}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                {busy ? "..." : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          className="flex size-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
              {user ? (
                <button
                  onClick={logout}
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-600"
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-center text-sm font-medium text-slate-600">
                    Sign in
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="flex-1 rounded-xl bg-brand-600 px-3 py-2.5 text-center text-sm font-semibold text-white">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
