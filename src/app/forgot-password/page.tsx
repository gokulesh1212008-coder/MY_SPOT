"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, Label, Card } from "@/components/ui";
import { apiFetch } from "@/lib/http";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFieldError("Enter your email address.");
      return;
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      setFieldError("That doesn't look like a complete email — e.g. you@example.com (don't forget the @).");
      return;
    }
    setFieldError("");
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await apiFetch("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: cleanEmail }) });
      setMessage("If that email exists, a reset link has been sent. (In dev, check the server console.)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-16">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your account email and we&apos;ll send a reset link.</p>
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "email-error" : undefined}
            />
            {fieldError && (
              <p id="email-error" className="mt-1.5 text-sm font-medium text-rose-600">
                {fieldError}
              </p>
            )}
          </div>
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}
          {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>}
          <Button type="submit" loading={busy} className="w-full" size="lg">
            Send reset link
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            ← Back to sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
