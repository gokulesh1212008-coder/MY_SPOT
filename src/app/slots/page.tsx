"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { apiFetch } from "@/lib/http";
import MobileBottomNav from "@/components/MobileBottomNav";
import type { SearchResultItem } from "@/lib/types";

const MUMBAI = { lat: 18.975, lng: 72.8258 };

export default function SlotsPage() {
  const [q, setQ] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [cctv, setCctv] = useState(false);
  const [covered, setCovered] = useState(false);
  const [slots, setSlots] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const sp = new URLSearchParams();
      sp.set("lat", String(MUMBAI.lat));
      sp.set("lng", String(MUMBAI.lng));
      if (q) sp.set("q", q);
      if (vehicleType) sp.set("vehicleType", vehicleType);
      if (priceMax) sp.set("priceMax", priceMax);
      if (cctv) sp.set("cctv", "true");
      if (covered) sp.set("covered", "true");
      sp.set("sort", "recommended");
      const data = await apiFetch<{ results: SearchResultItem[] }>(`/api/parking?${sp.toString()}`);
      setSlots(data.results);
      if (data.results.length === 0) setError("No slots match these filters. Try clearing some.");
    } catch {
      setError("Could not load slots. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [q, vehicleType, priceMax, cctv, covered]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

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
            <Link href="/slots" className="rounded-lg bg-brand-50 px-3 py-1.5 text-brand-700">
              Slots
            </Link>
            <Link href="/report" className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100">
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

      <main className="mx-auto max-w-5xl space-y-4 px-4 pt-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Parking slots</h1>
          <p className="mt-1 text-sm text-slate-500">Recommended spaces in and around Mumbai — search by landmark or filter by what you need.</p>
        </div>

        {/* Search + filters */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search slots — area, landmark, name" className="pl-10" aria-label="Search slots" />
            </div>
            <Button type="submit" loading={loading}>
              Search slots
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500"
              aria-label="Vehicle type filter"
            >
              <option value="">Any vehicle</option>
              <option value="BIKE">Bike</option>
              <option value="CAR">Car</option>
              <option value="SUV">SUV</option>
              <option value="TRUCK">Truck</option>
            </select>
            <select
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500"
              aria-label="Max price filter"
            >
              <option value="">Any price</option>
              <option value="60">Under ₹60/hr</option>
              <option value="80">Under ₹80/hr</option>
              <option value="100">Under ₹100/hr</option>
              <option value="150">Under ₹150/hr</option>
            </select>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-600">
              <input type="checkbox" checked={cctv} onChange={(e) => setCctv(e.target.checked)} className="size-4 accent-brand-600" />
              📹 CCTV
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-600">
              <input type="checkbox" checked={covered} onChange={(e) => setCovered(e.target.checked)} className="size-4 accent-brand-600" />
              🏠 Covered
            </label>
          </div>
        </form>

        {error && <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{error}</p>}

        {/* Slots grid */}
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((s, idx) => (
              <Link
                key={s.id}
                href={`/parking/${s.id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-36 bg-slate-100">
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image} alt={s.title} className="size-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-4xl">🅿️</div>
                  )}
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
                    {s.verificationStatus === "VERIFIED" && (
                      <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">✓ Verified</span>
                    )}
                    <span className="ml-auto rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold text-slate-800 shadow">
                      {idx + 1} {idx === 0 ? "top pick" : ""}
                    </span>
                  </div>
                  <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/85 px-2.5 py-1 text-xs font-bold text-white">
                    ₹{s.pricePerHour}/hr
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="truncate font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{s.landmark ?? s.address}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.hasCCTV && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">📹 CCTV</span>}
                    {s.isCovered && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Covered</span>}
                    {s.isIndoor && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Indoor</span>}
                    {s.hasEV && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">⚡ EV</span>}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    ★ {s.rating.toFixed(1)} ({s.ratingCount}){s.distanceKm !== null && s.distanceKm !== undefined ? ` · ${s.distanceKm.toFixed(1)} km` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
