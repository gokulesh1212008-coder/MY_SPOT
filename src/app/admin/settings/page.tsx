"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import { Button, Card, Input } from "@/components/ui";

interface Settings {
  commissionRate: number;
  feeRate: number;
  taxRate: number;
  convenienceFee: number;
  refundFullHours: number;
  refundHalfHours: number;
  maxBookingHours: number;
  cancelGraceMinutes: number;
  currency: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch<{ settings: Settings }>("/api/admin/settings").then((d) => {
      setSettings(d.settings);
      const f: Record<string, string> = {};
      for (const [k, v] of Object.entries(d.settings)) f[k] = String(v);
      setForm(f);
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const body: Record<string, unknown> = {};
      for (const key of [
        "commissionRate",
        "feeRate",
        "taxRate",
        "convenienceFee",
        "refundFullHours",
        "refundHalfHours",
        "maxBookingHours",
        "cancelGraceMinutes",
      ]) {
        body[key] = Number(form[key]);
      }
      body.currency = form.currency;
      await apiFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify(body) });
      setMessage("Settings saved ✓");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  const fields: { key: string; label: string; hint: string; pct?: boolean }[] = [
    { key: "commissionRate", label: "Owner commission", hint: "Share of base fee kept by MYSPOT per booking", pct: true },
    { key: "feeRate", label: "Platform fee rate", hint: "Added on top of parking fee", pct: true },
    { key: "taxRate", label: "Tax rate (GST)", hint: "Applied to base + fee", pct: true },
    { key: "convenienceFee", label: "Convenience fee", hint: "Flat per booking" },
    { key: "refundFullHours", label: "Full refund window (hours)", hint: "Cancel ≥ this many hours before start → 100% refund" },
    { key: "refundHalfHours", label: "Half refund window (hours)", hint: "Cancel ≥ this many hours before start → 50% refund" },
    { key: "maxBookingHours", label: "Max booking length (hours)", hint: "Longest allowed booking" },
    { key: "cancelGraceMinutes", label: "Cancellation grace (minutes)", hint: "Reserved for future use" },
    { key: "currency", label: "Currency", hint: "ISO code, e.g. INR" },
  ];

  if (!settings) return <p className="text-sm text-slate-500">Loading settings…</p>;

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-xl font-extrabold text-slate-900">Platform settings</h2>
      <p className="mt-1 text-sm text-slate-500">
        Business rules are configurable — never hard-coded. Changes apply immediately to new bookings.
      </p>
      <form onSubmit={save} className="mt-6 space-y-4">
        {fields.map((f) => (
          <Card key={f.key} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-slate-900">{f.label}</p>
              <p className="text-xs text-slate-500">{f.hint}</p>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="any"
                min="0"
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                className="w-32"
              />
              {f.pct && <span className="text-sm text-slate-500">%</span>}
            </div>
          </Card>
        ))}
        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}
        {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
        <Button type="submit" loading={busy}>Save settings</Button>
      </form>
    </div>
  );
}
