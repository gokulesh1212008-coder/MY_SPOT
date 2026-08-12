"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card } from "@/components/ui";
import { apiFetch } from "@/lib/http";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; phone?: string; password?: string }>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function validate(): boolean {
    const errors: { name?: string; email?: string; phone?: string; password?: string } = {};
    if (!name.trim()) errors.name = "Enter your full name.";
    const cleanEmail = email.trim();
    if (!cleanEmail) errors.email = "Enter your email address.";
    else if (!EMAIL_RE.test(cleanEmail)) errors.email = "That doesn't look like a complete email — e.g. you@example.com (don't forget the @).";
    if (phone.trim() && !/^[+\d][\d\s-]{7,14}$/.test(phone.trim())) errors.phone = "Enter a valid phone number, e.g. +91 90000 00000.";
    if (!password) errors.password = "Choose a password (at least 8 characters).";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setError("");
    setBusy(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), password }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-slate-950 px-4 py-16">
      <div className="absolute -left-24 top-0 size-96 rounded-full bg-brand-600/30 blur-[110px]" />
      <div className="absolute -right-24 bottom-0 size-96 rounded-full bg-cyan-500/25 blur-[110px]" />
      <Card className="relative w-full max-w-md p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-2xl text-white shadow-lg shadow-brand-600/30">🚗</span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Start booking parking in under a minute.</p>
        </div>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aarav Sharma"
              autoComplete="name"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
            />
            {fieldErrors.name && (
              <p id="name-error" className="mt-1.5 text-sm font-medium text-rose-600">
                {fieldErrors.name}
              </p>
            )}
          </div>
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
            <Label htmlFor="phone">Phone (for OTP)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 90000 00000"
              autoComplete="tel"
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
            />
            {fieldErrors.phone && (
              <p id="phone-error" className="mt-1.5 text-sm font-medium text-rose-600">
                {fieldErrors.phone}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Password (min 8 characters)</Label>
            <Input
              id="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
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
            Create account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
