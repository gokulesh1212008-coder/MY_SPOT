"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import { Card, StatusBadge } from "@/components/ui";
import { formatDateTime, formatMoney } from "@/lib/format";

interface AdminBooking {
  id: string;
  bookingRef: string;
  status: string;
  startAt: string;
  endAt: string;
  totalAmount: number;
  space: { title: string; currency: string };
  user: { name: string };
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ bookings: AdminBooking[] }>("/api/bookings?role=all")
      .then((d) => setBookings(d.bookings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-slate-900">All bookings</h2>
      <p className="mt-1 text-sm text-slate-500">Every booking across the platform.</p>
      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          bookings.map((b) => (
            <Card key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{b.space.title}</p>
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-sm text-slate-500">
                  {b.user.name} · {formatDateTime(b.startAt)} → {formatDateTime(b.endAt)}
                </p>
                <p className="text-xs text-slate-400">{b.bookingRef}</p>
              </div>
              <p className="font-bold text-slate-900">{formatMoney(b.totalAmount, b.space.currency)}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
