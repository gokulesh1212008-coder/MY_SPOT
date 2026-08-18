"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card } from "@/components/ui";
import { apiFetch } from "@/lib/http";

const DEMO_ACCOUNTS = [
  { label: "Driver", email: "driver@myspot.app", icon: "🚗" },
  { label: "Owner", email: "owner@myspot.app", icon: "🏠" },
  { label: "Admin", email: "admin@myspot.app", icon: "🛡️" },
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {};
    const cleanEmail = email.trim();
    if (!cleanEmail) errors.email = "Enter your email address.";
    else if (!EMAIL_RE.test(cleanEmail)) errors.email = "That doesn't look like a complete email — e.g. you@example.com (don't forget the @).";
    if (!password) errors.password = "Enter your password.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function signIn(credentials: { email: string; password: string }) {
    setError("");
    setFieldErrors({});
    setBusy(true);
    try {
      const d = await apiFetch<{ user: { isAdmin?: boolean; isOwner?: boolean } }>("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) });
      // Route each role to its own interface.
      if (d.user?.isAdmin) router.push("/admin");
      else if (d.user?.isOwner) router.push("/owner");
      else router.push("/map");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    signIn({ email: email.trim(), password });
  }

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-slate-950 px-4 py-16">
      <div className="absolute -left-24 top-0 size-96 rounded-full bg-brand-600/30 blur-[110px]" />
      <div className="absolute -right-24 bottom-0 size-96 rounded-full bg-violet-600/30 blur-[110px]" />
      <Card className="relative w-full max-w-md p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-2xl text-white shadow-lg shadow-brand-600/30">🅿️</span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to book parking or manage your spaces.</p>
        </div>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <p id="email-error" className="mt-1.5 text-sm font-medium text-rose-600">
                {fieldErrors.email}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
            />
            {fieldErrors.password && (
              <p id="password-error" className="mt-1.5 text-sm font-medium text-rose-600">
                {fieldErrors.password}
              </p>
            )}
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
              {error}
            </p>
          )}
          <Button type="submit" loading={busy} className="w-full" size="lg">
            Sign in
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
          <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Create account
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
          <p className="font-semibold text-slate-600">Demo accounts — one click, no typing needed</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={busy}
                onClick={() => signIn({ email: acc.email, password: "demo1234" })}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50"
              >
                {acc.icon} {acc.label}
              </button>
            ))}
          </div>
          <p className="mt-2">Password for all demos: <code className="font-mono font-semibold text-slate-700">demo1234</code></p>
        </div>
      </Card>
    </div>
  );
}
