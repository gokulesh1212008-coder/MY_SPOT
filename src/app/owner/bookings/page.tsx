"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import { Button, Card, EmptyState, StatusBadge, Badge } from "@/components/ui";
import { formatDateTime, formatMoney } from "@/lib/format";

interface Booking {
  id: string;
  bookingRef: string;
  status: string;
  ownerApproved: boolean;
  startAt: string;
  endAt: string;
  ownerAmount: number;
  space: { id: string; title: string; currency: string };
  vehicle: { model: string; regNumber: string; type: string };
  user: { name: string };
  review: unknown;
}

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<{ bookings: Booking[] }>("/api/bookings?role=all");
      setBookings(d.bookings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(b: Booking, approve: boolean) {
    setError("");
    try {
      await apiFetch(`/api/bookings/${b.id}/approve`, { method: "POST", body: JSON.stringify({ approve }) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-slate-900">Bookings for your spaces</h2>
      <p className="mt-1 text-sm text-slate-500">Approve vehicles before they arrive, and track every stay.</p>

      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : bookings.length === 0 ? (
          <EmptyState title="No bookings yet" body="When drivers book your spaces, they'll appear here." />
        ) : (
          bookings.map((b) => {
            const needsApproval = b.status === "CONFIRMED" && !b.ownerApproved;
            return (
              <Card key={b.id} className={`p-5 ${needsApproval ? "border-amber-300 bg-amber-50/40" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{b.space.title}</h3>
                      <StatusBadge status={b.status} />
                      {needsApproval && <Badge color="amber">Approval needed</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {b.user.name} · {formatDateTime(b.startAt)} → {formatDateTime(b.endAt)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {b.vehicle.model} · {b.vehicle.regNumber} ({b.vehicle.type}) · {b.bookingRef}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">+{formatMoney(b.ownerAmount, b.space.currency)}</p>
                    {needsApproval && (
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => decide(b, true)}>✓ Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => decide(b, false)}>✕ Reject</Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
