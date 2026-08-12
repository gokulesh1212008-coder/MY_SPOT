"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button, Input, Label, Card } from "@/components/ui";
import { apiFetch } from "@/lib/http";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await apiFetch("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ email, token, password }) });
      setMessage("Password updated! Redirecting to sign in…");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md p-8 shadow-lg">
      <h1 className="font-display text-2xl font-extrabold text-slate-900">Choose a new password</h1>
      <p className="mt-1 text-sm text-slate-500">For account {email || "(provided in link)"}</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}
        {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>}
        <Button type="submit" loading={busy} className="w-full" size="lg">
          Update password
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          ← Back to sign in
        </Link>
      </p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-16">
      <Suspense fallback={<Card className="w-full max-w-md p-8 text-center text-slate-500">Loading…</Card>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
