"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { apiFetch } from "@/lib/http";
import type { ClientUser } from "@/lib/types";
import { Button, Card, Input, Label } from "@/components/ui";

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <SettingsInner />
    </Suspense>
  );
}

function SettingsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [user, setUser] = useState<ClientUser | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch<{ user: ClientUser }>("/api/auth/me").then((d) => {
      setUser(d.user);
      setName(d.user.name);
      setPhone(d.user.phone ?? "");
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const d = await apiFetch<{ user: ClientUser }>("/api/user", { method: "PATCH", body: JSON.stringify({ name, phone }) });
      setUser(d.user);
      setMessage("Profile updated ✓");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function becomeOwner() {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const d = await apiFetch<{ user: ClientUser }>("/api/user", { method: "PATCH", body: JSON.stringify({ becomeOwner: true }) });
      setUser(d.user);
      setMessage("You are now a parking owner! Open the Owner panel to list your first space.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upgrade failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-extrabold text-slate-900">Account settings</h1>
      <p className="mt-1 text-sm text-slate-500">Manage your profile and account type.</p>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg font-bold text-slate-900">Profile</h2>
        <form onSubmit={save} className="mt-4 space-y-4">
          <div>
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Email (cannot change)</Label>
            <Input value={user?.email ?? ""} disabled className="bg-slate-50" />
          </div>
          <div>
            <Label>Phone (used for OTP)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 00000" />
          </div>
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}
          {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>}
          <Button type="submit" loading={busy}>Save changes</Button>
        </form>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg font-bold text-slate-900">Account type</h2>
        {user?.isOwner ? (
          <p className="mt-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            ✓ You are a parking owner. List spaces and earn from the Owner panel.
          </p>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-slate-600">
              Turn your unused driveway, garage or society slot into income. Owners set their own prices and hours.
            </p>
            <Button onClick={becomeOwner} loading={busy} className="mt-4" variant="success">
              Become a parking owner
            </Button>
          </div>
        )}
        {user?.isAdmin && (
          <p className="mt-3 rounded-xl bg-slate-50 px-4 py-2 text-xs text-slate-500">Admin account — you can access the Admin panel.</p>
        )}
        {params.get("becomeOwner") === "1" && !user?.isOwner && (
          <p className="mt-3 text-xs text-amber-600">Use the button above to enable owner mode.</p>
        )}
      </Card>
    </div>
  );
}
