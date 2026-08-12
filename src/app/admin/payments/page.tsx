"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import { Card, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/format";

interface Payment {
  id: string;
  type: string;
  amount: number;
  status: string;
  provider: string;
  providerRef: string | null;
  createdAt: string;
  booking: { bookingRef: string; space: { title: string }; user: { name: string } };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<{ payments: Payment[] }>("/api/admin/payments");
      setPayments(d.payments);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-slate-900">Payments & transactions</h2>
      <p className="mt-1 text-sm text-slate-500">
        All charges, extensions and refunds. Cards are never stored — providers handle tokenization.
      </p>
      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-slate-500">No payments yet.</p>
        ) : (
          payments.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{p.booking.space.title}</p>
                  <Badge color={p.status === "SUCCESS" ? "green" : p.status === "FAILED" ? "red" : "amber"}>{p.status}</Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {p.type} · {p.booking.user.name} · {p.booking.bookingRef}
                </p>
                <p className="text-xs text-slate-400">
                  {p.provider} · {p.providerRef ?? "—"} · {new Date(p.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <p className={`font-bold ${p.type === "REFUND" ? "text-rose-600" : "text-slate-900"}`}>
                {p.type === "REFUND" ? "−" : ""}
                {formatMoney(p.amount, "INR")}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
