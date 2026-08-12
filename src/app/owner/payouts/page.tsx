"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import { Button, Card, Input, StatCard, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/format";

interface Payout {
  id: string;
  amount: number;
  status: string;
  note: string | null;
  createdAt: string;
}

export default function PayoutsPage() {
  const [stats, setStats] = useState<{ earningsTotal: number; pendingPayouts: number } | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState(0);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<{ stats: { earningsTotal: number; pendingPayouts: number }; payouts: Payout[] }>("/api/owner/stats");
      setStats(d.stats);
      setPayouts(d.payouts);
      setAvailable(d.stats.earningsTotal - d.payouts.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await apiFetch("/api/owner/payouts", { method: "POST", body: JSON.stringify({ amount: Number(amount) }) });
      setAmount("");
      setMessage("Payout requested ✓");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-slate-900">Payouts</h2>
      <p className="mt-1 text-sm text-slate-500">Withdraw your earnings whenever you like — MYSPOT holds owner funds safely.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total earned" value={stats ? formatMoney(stats.earningsTotal) : "—"} icon="💰" />
        <StatCard label="Pending payouts" value={stats ? formatMoney(stats.pendingPayouts) : "—"} icon="⏳" />
        <StatCard label="Available now" value={formatMoney(available)} icon="🏦" />
      </div>

      <Card className="mt-6 max-w-md p-6">
        <h3 className="font-display text-lg font-bold text-slate-900">Request payout</h3>
        <form onSubmit={request} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount (₹)</label>
            <Input type="number" min="1" max={available} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Up to ${available.toFixed(0)}`} required />
          </div>
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}
          {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>}
          <Button type="submit" loading={busy} className="w-full" disabled={available <= 0}>
            Request payout
          </Button>
          <p className="text-xs text-slate-400">Payouts are reviewed by MYSPOT and paid to your registered bank account (bank integration is part of going live).</p>
        </form>
      </Card>

      {payouts.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 font-display text-lg font-bold text-slate-900">Payout history</h3>
          <div className="space-y-2">
            {payouts.map((p) => (
              <Card key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-slate-900">{formatMoney(p.amount)}</p>
                  <p className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <Badge color={p.status === "PAID" ? "green" : "amber"}>{p.status}</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
