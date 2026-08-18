"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Label } from "@/components/ui";
import { apiFetch } from "@/lib/http";
import MobileBottomNav from "@/components/MobileBottomNav";

interface BookingRow {
  id: string;
  bookingRef: string;
  status: string;
  startAt: string;
  endAt: string;
  totalAmount: number;
  space: { title: string; hasCCTV: boolean; images: { url: string }[] };
}

const CAMERAS = [
  { name: "Entrance Gate", color: "from-slate-700 to-slate-900", sub: "Gate cam · motion active" },
  { name: "Driveway Bay A", color: "from-indigo-800 to-slate-900", sub: "Bay cam · occupancy 1/1" },
  { name: "Covered Garage", color: "from-slate-800 to-slate-950", sub: "Indoor cam · lights on" },
  { name: "Perimeter", color: "from-violet-900 to-slate-950", sub: "Outdoor cam · clear" },
];

const INCIDENT_TYPES = [
  "unauthorized_vehicle",
  "parking_dispute",
  "damage",
  "safety_concern",
  "access_problem",
  "payment_issue",
  "booking_issue",
  "misuse",
  "other",
];

export default function ReportPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [type, setType] = useState("other");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    try {
      const d = await apiFetch<{ bookings: BookingRow[] }>("/api/bookings");
      setBookings(d.bookings.slice(0, 5));
    } catch {
      /* keep empty */
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await apiFetch("/api/incidents", {
        method: "POST",
        body: JSON.stringify({ type, description }),
      });
      setDescription("");
      setMessage("Incident reported. Our team will review it and keep you updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to report incident.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/map" className="flex items-center gap-1.5 font-display text-lg font-extrabold text-slate-900">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-md">🅿️</span>
            MY<span className="text-brand-600">SPOT</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex">
            <Link href="/map" className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100">
              Map
            </Link>
            <Link href="/slots" className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100">
              Slots
            </Link>
            <Link href="/report" className="rounded-lg bg-brand-50 px-3 py-1.5 text-brand-700">
              Report
            </Link>
            <Link href="/dashboard" className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100">
              My bookings
            </Link>
          </nav>
          <Link href="/dashboard" className="rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700">
            My account
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 pt-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Safety & reports</h1>
          <p className="mt-1 text-sm text-slate-500">Watch your parked vehicle over live CCTV, review recent bookings, and report anything unusual.</p>
        </div>

        {/* CCTV footage */}
        <section aria-labelledby="cctv-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="cctv-heading" className="font-display text-lg font-extrabold text-slate-900">
              📹 Live CCTV footage
            </h2>
            <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600">
              <span className="size-1.5 animate-pulse rounded-full bg-rose-500" /> LIVE
            </span>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Demo streams for your active booking — connect a real camera feed via the CCTV integration point to stream live video.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {CAMERAS.map((cam) => (
              <div key={cam.name} className="relative overflow-hidden rounded-xl">
                <div className={`flex h-36 items-center justify-center bg-gradient-to-br ${cam.color}`}>
                  {/* Mock feed: subtle scan-line shimmer */}
                  <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(0deg,transparent_0px,transparent_3px,rgba(255,255,255,.15)_4px)]" />
                  <div className="relative text-center">
                    <p className="text-2xl">📷</p>
                    <p className="mt-1 text-xs font-bold text-white/90">{cam.sub}</p>
                  </div>
                  <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white">CAM {cam.name.split(" ")[0]}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5">
                  <span className="text-[11px] font-semibold text-slate-300">{cam.name}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} IST
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent bookings */}
        <section aria-labelledby="bookings-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="bookings-heading" className="font-display text-lg font-extrabold text-slate-900">
              📅 Recent bookings
            </h2>
            <Link href="/dashboard/bookings" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No bookings yet — <Link href="/map" className="font-semibold text-brand-600">find a slot</Link> to see them here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg">🅿️</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{b.space.title}</p>
                    <p className="text-xs text-slate-500">
                      {b.bookingRef} · {new Date(b.startAt).toLocaleDateString()} · ₹{b.totalAmount}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                    {b.status.replace(/_/g, " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Report an incident */}
        <section aria-labelledby="report-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 id="report-heading" className="font-display text-lg font-extrabold text-slate-900">
            🛡️ Report an issue
          </h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">Damaged vehicle, unauthorized entry, safety concern — our team investigates every report.</p>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="incidentType">Issue type</Label>
              <select
                id="incidentType"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              >
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="incidentDesc">Describe what happened</Label>
              <textarea
                id="incidentDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="At least 10 characters — e.g. a vehicle parked in my booked bay without authorization…"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </div>
            {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>}
            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}
            <Button type="submit" loading={busy} className="w-full sm:w-auto">
              Submit report
            </Button>
          </form>
        </section>
      </main>

      <MobileBottomNav />
    </div>
  );
}
