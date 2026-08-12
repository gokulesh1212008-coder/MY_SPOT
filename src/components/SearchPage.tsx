"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/http";
import type { SearchResultItem } from "@/lib/types";
import { Button, Select, Input, Label, Card, Badge, Spinner, EmptyState } from "./ui";
import ParkingCard from "./ParkingCard";
import MapView from "./DynamicMapView";
import type { MapMarker } from "./MapView";
import { CITIES, DEFAULT_CENTER } from "@/lib/geo";

function localISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function localTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const addHours = (d: Date, h: number) => new Date(d.getTime() + h * 3600 * 1000);

export default function SearchPage() {
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";

  const now = new Date();
  const [q, setQ] = useState(initialQ);
  const [place, setPlace] = useState<string>(DEFAULT_CENTER.name);
  const [lat, setLat] = useState<number | undefined>(DEFAULT_CENTER.lat);
  const [lng, setLng] = useState<number | undefined>(DEFAULT_CENTER.lng);
  const [date, setDate] = useState(localISODate(now));
  const [startTime, setStartTime] = useState(localTime(addHours(now, 1)));
  const [endTime, setEndTime] = useState(localTime(addHours(now, 3)));
  const [vehicleType, setVehicleType] = useState("CAR");
  const [priceMax, setPriceMax] = useState("");
  const [covered, setCovered] = useState(false);
  const [cctv, setCctv] = useState(false);
  const [ev, setEv] = useState(false);
  const [ratingMin, setRatingMin] = useState("");
  const [sort, setSort] = useState("recommended");
  const [view, setView] = useState<"list" | "map">("list");

  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const aborter = useRef<AbortController | null>(null);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError("");
    aborter.current?.abort();
    const ctrl = new AbortController();
    aborter.current = ctrl;
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (lat !== undefined && lng !== undefined) {
      sp.set("lat", String(lat));
      sp.set("lng", String(lng));
    }
    if (date) sp.set("date", date);
    if (startTime) sp.set("startTime", startTime);
    if (endTime) sp.set("endTime", endTime);
    if (vehicleType) sp.set("vehicleType", vehicleType);
    if (priceMax) sp.set("priceMax", priceMax);
    if (covered) sp.set("covered", "true");
    if (cctv) sp.set("cctv", "true");
    if (ev) sp.set("ev", "true");
    if (ratingMin) sp.set("ratingMin", ratingMin);
    sp.set("sort", sort);
    try {
      const data = await apiFetch<{ results: SearchResultItem[] }>(`/api/parking?${sp.toString()}`, {
        signal: ctrl.signal,
        headers: {},
      });
      setResults(data.results);
      setSelectedId((id) => (id && data.results.some((r) => r.id === id) ? id : null));
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Could not load parking results. Please try again.");
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [q, lat, lng, date, startTime, endTime, vehicleType, priceMax, covered, cctv, ev, ratingMin, sort]);

  useEffect(() => {
    runSearch();
    return () => aborter.current?.abort();
  }, [runSearch]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setPlace("My current location");
        setGeoBusy(false);
      },
      () => {
        setError("Could not access your location. Choose a city preset instead.");
        setGeoBusy(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function pickPlace(name: string) {
    const city = CITIES.find((c) => c.name === name);
    if (city) {
      setLat(city.lat);
      setLng(city.lng);
    }
    setPlace(name);
  }

  const markers: MapMarker[] = useMemo(
    () =>
      results.map((r) => ({
        id: r.id,
        lat: r.lat,
        lng: r.lng,
        title: r.title,
        price: r.pricePerHour,
        currency: r.currency,
      })),
    [results]
  );

  const center = useMemo(
    () => (lat !== undefined && lng !== undefined ? { lat, lng } : { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng }),
    [lat, lng]
  );

  const selected = results.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Search bar */}
      <Card className="p-5 shadow-md">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Label>Search area / landmark</Label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mall, office, street…" />
          </div>
          <div className="lg:col-span-3">
            <Label>Location</Label>
            <div className="flex gap-2">
              <Select value={place} onChange={(e) => pickPlace(e.target.value)} className="flex-1">
                <option value={DEFAULT_CENTER.name}>📍 {DEFAULT_CENTER.name}</option>
                {CITIES.filter((c) => c.name !== DEFAULT_CENTER.name).map((c) => (
                  <option key={c.name} value={c.name}>
                    📍 {c.name}
                  </option>
                ))}
                {place === "My current location" && <option value="My current location">📍 My current location</option>}
              </Select>
              <Button variant="outline" onClick={useMyLocation} loading={geoBusy} className="whitespace-nowrap">
                📡
              </Button>
            </div>
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>From</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div className="lg:col-span-2">
            <Label>Vehicle</Label>
            <Select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
              <option value="CAR">Car</option>
              <option value="BIKE">Bike</option>
              <option value="SUV">SUV</option>
              <option value="TRUCK">Truck</option>
              <option value="ANY">Any</option>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <span className="text-sm font-medium text-slate-500">Filters:</span>
          <FilterChip active={covered} onClick={() => setCovered(!covered)}>☂️ Covered</FilterChip>
          <FilterChip active={cctv} onClick={() => setCctv(!cctv)}>📹 CCTV</FilterChip>
          <FilterChip active={ev} onClick={() => setEv(!ev)}>⚡ EV charging</FilterChip>
          <div className="w-32">
            <Select value={priceMax} onChange={(e) => setPriceMax(e.target.value)}>
              <option value="">Max price: any</option>
              <option value="30">₹30/hr</option>
              <option value="50">₹50/hr</option>
              <option value="80">₹80/hr</option>
              <option value="120">₹120/hr</option>
            </Select>
          </div>
          <div className="w-36">
            <Select value={ratingMin} onChange={(e) => setRatingMin(e.target.value)}>
              <option value="">Any rating</option>
              <option value="4">4★ and up</option>
              <option value="4.5">4.5★ and up</option>
            </Select>
          </div>
          <div className="w-44">
            <Select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recommended">✨ Recommended</option>
              <option value="distance">📍 Nearest first</option>
              <option value="price_asc">💸 Cheapest first</option>
              <option value="price_desc">💰 Priciest first</option>
              <option value="rating">⭐ Top rated</option>
            </Select>
          </div>
          <Button onClick={runSearch} loading={loading} className="ml-auto">
            Search
          </Button>
        </div>
      </Card>

      {/* View toggle */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {loading ? <span className="inline-flex items-center gap-2"><Spinner className="size-3.5" /> Finding available parking…</span> : `${results.length} available space${results.length === 1 ? "" : "s"}`}
        </p>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          <button
            onClick={() => setView("list")}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${view === "list" ? "bg-brand-600 text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            ☰ List
          </button>
          <button
            onClick={() => setView("map")}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${view === "map" ? "bg-brand-600 text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            🗺️ Map
          </button>
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}

      {/* Results */}
      {view === "list" ? (
        loading && results.length === 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No parking spaces found for your selected time"
              body="Try adjusting the time, filters, or searching in a different area."
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((item, i) => (
              <div key={item.id} className="relative">
                {item.reasons.length > 0 && (
                  <div className="pointer-events-none absolute -top-2.5 left-3 z-10 rounded-full border border-brand-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-brand-700 shadow-sm">
                    ✨ {item.reasons[0]}
                  </div>
                )}
                <ParkingCard item={item} highlight={i === 0 && sort === "recommended"} />
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="mt-6">
          <MapView markers={markers} center={center} selectedId={selectedId} onSelect={(id) => setSelectedId(id)} height={560} />
          {selected && (
            <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-brand-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-slate-900">{selected.title}</h3>
                  {selected.verificationStatus === "VERIFIED" && <Badge color="green">✓ Verified</Badge>}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {selected.currency === "INR" ? "₹" : ""}
                  {selected.pricePerHour}/hr · ★ {selected.rating.toFixed(1)} ({selected.ratingCount}) ·{" "}
                  {selected.distanceKm !== null ? `${selected.distanceKm.toFixed(1)} km away` : selected.address}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selected.reasons.map((r) => (
                    <Badge key={r} color="violet">✨ {r}</Badge>
                  ))}
                </div>
              </div>
              <Link href={`/parking/${selected.id}`}>
                <Button>Book this parking</Button>
              </Link>
            </div>
          )}
        </div>
      )}
      <p className="mt-4 text-xs text-slate-400">Results shown are available for your selected date &amp; time.</p>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active ? "border-brand-500 bg-brand-600 text-white shadow-sm" : "border-slate-300 bg-white text-slate-600 hover:border-brand-400"
      }`}
    >
      {children}
    </button>
  );
}
