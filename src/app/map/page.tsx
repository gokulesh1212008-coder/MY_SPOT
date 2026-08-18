"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { apiFetch } from "@/lib/http";
import DynamicLiveMap from "@/components/DynamicLiveMap";
import type { LiveMapMarker } from "@/components/LiveMap";
import MobileBottomNav from "@/components/MobileBottomNav";
import type { SearchResultItem } from "@/lib/types";

const MUMBAI = { lat: 18.975, lng: 72.8258 };

export default function MapPage() {
  const [center, setCenter] = useState(MUMBAI);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [dest, setDest] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [geoLabel, setGeoLabel] = useState("");
  const mounted = useRef(false);

  const runSearch = useCallback(async (lat?: number, lng?: number, query?: string) => {
    setLoading(true);
    setError("");
    try {
      const sp = new URLSearchParams();
      if (lat !== undefined && lng !== undefined) {
        sp.set("lat", String(lat));
        sp.set("lng", String(lng));
      }
      if (query) sp.set("q", query);
      sp.set("sort", "recommended");
      const data = await apiFetch<{ results: SearchResultItem[] }>(`/api/parking?${sp.toString()}`);
      setResults(data.results);
      setSelectedId((id) => (id && data.results.some((r) => r.id === id) ? id : null));
      if (data.results.length === 0) setError("No parking found near this destination yet. Try another spot or widen your search.");
    } catch {
      setError("Could not load parking results. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: try live location, fall back to Mumbai; show nearby slots.
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCenter(loc);
          setGeoLabel("📍 Live location");
          runSearch(loc.lat, loc.lng);
        },
        () => {
          setGeoLabel("📍 Mumbai (default)");
          runSearch(MUMBAI.lat, MUMBAI.lng);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      runSearch(MUMBAI.lat, MUMBAI.lng);
    }
  }, [runSearch]);

  // Destination search: geocode (keyless OSM Nominatim; swap for Places when a
  // Google Maps key is configured) then search nearby parking.
  async function searchDestination(e: React.FormEvent) {
    e.preventDefault();
    const query = dest.trim();
    if (!query) return;
    setError("");
    setLoading(true);
    try {
      const geo = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } }
      ).then((r) => r.json());
      if (geo && geo[0]) {
        const loc = { lat: Number(geo[0].lat), lng: Number(geo[0].lon) };
        setCenter(loc);
        setGeoLabel(`📍 ${geo[0].display_name.split(",").slice(0, 2).join(",")}`);
        setQ(query);
        await runSearch(loc.lat, loc.lng, query);
      } else {
        setError(`Couldn't find "${query}". Try a city or landmark name.`);
        setLoading(false);
      }
    } catch {
      setError("Geocoding failed — check your connection and try again.");
      setLoading(false);
    }
  }

  const markers: LiveMapMarker[] = results.map((r) => ({
    id: r.id,
    lat: r.lat,
    lng: r.lng,
    title: r.title,
    price: r.pricePerHour,
    currency: r.currency,
  }));

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/map" className="flex items-center gap-1.5 font-display text-lg font-extrabold text-slate-900">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-md">🅿️</span>
            MY<span className="text-brand-600">SPOT</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex">
            <Link href="/map" className="rounded-lg bg-brand-50 px-3 py-1.5 text-brand-700">
              Map
            </Link>
            <Link href="/slots" className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100">
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
        {/* Destination search */}
        <form onSubmit={searchDestination} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <Input
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              placeholder="Search destination — e.g. Gateway of India, Colaba"
              className="rounded-2xl py-3 pl-10 shadow-sm"
              aria-label="Search destination"
            />
          </div>
          <Button type="submit" loading={loading} className="rounded-2xl px-6">
            Find parking
          </Button>
        </form>

        {/* Live map */}
        <DynamicLiveMap
          markers={markers}
          center={center}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          onLocate={(loc) => {
            setCenter(loc);
            setGeoLabel("📍 Live location");
            runSearch(loc.lat, loc.lng);
          }}
          height={460}
        />
        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          {geoLabel || "📍 Locating…"} · {markers.length} slot{markers.length === 1 ? "" : "s"} shown {q ? `near "${q}"` : "near you"}
        </p>

        {error && <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{error}</p>}

        {/* Nearby parking list */}
        <section aria-label="Nearby parking results">
          <h2 className="mb-3 font-display text-xl font-extrabold text-slate-900">
            {q ? `Parking near "${q}"` : "Recommended slots near you"}
          </h2>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-3xl">🅿️</p>
              <p className="mt-2 font-semibold text-slate-700">No slots found</p>
              <p className="mt-1 text-sm text-slate-500">Try a nearby area or remove filters.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((r) => (
                <Link
                  key={r.id}
                  href={`/parking/${r.id}`}
                  onMouseEnter={() => setSelectedId(r.id)}
                  className="group flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {r.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image} alt={r.title} className="size-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-3xl">🅿️</div>
                    )}
                    {r.verificationStatus === "VERIFIED" && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">✓ Verified</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-900">{r.title}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                      {r.distanceKm !== null && r.distanceKm !== undefined ? `${r.distanceKm.toFixed(1)} km · ` : ""}
                      {r.landmark ?? r.address}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.hasCCTV && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">CCTV</span>}
                      {r.isCovered && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Covered</span>}
                      {r.hasEV && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">⚡ EV</span>}
                    </div>
                    <p className="mt-2 text-sm font-bold text-brand-600">
                      ₹{r.pricePerHour}/hr <span className="ml-1 text-xs font-medium text-slate-400">★ {r.rating.toFixed(1)}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <MobileBottomNav />
    </div>
  );
}
