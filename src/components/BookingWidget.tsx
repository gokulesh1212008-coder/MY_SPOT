"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/http";
import type { ClientUser } from "@/lib/types";
import { Button, Select, Input, Label, Card, Badge } from "./ui";

interface PricingSettings {
  commissionRate: number;
  feeRate: number;
  taxRate: number;
  convenienceFee: number;
  refundFullHours: number;
  refundHalfHours: number;
  maxBookingHours: number;
  currency: string;
  sandboxPaymentLabel: string;
}

interface SpaceInfo {
  id: string;
  title: string;
  pricePerHour: number;
  currency: string;
  openHour: number;
  closeHour: number;
  autoApprove: boolean;
  lat: number;
  lng: number;
  verificationStatus: string;
}

function localDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export default function BookingWidget({ space, user }: { space: SpaceInfo; user: ClientUser | null }) {
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [vehicles, setVehicles] = useState<{ id: string; regNumber: string; model: string; type: string; isActive: boolean }[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [date, setDate] = useState(localDate(new Date()));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ bookingId: string; otp?: string; message: string } | null>(null);

  useEffect(() => {
    apiFetch<{ settings: PricingSettings }>("/api/settings")
      .then((d) => setSettings(d.settings))
      .catch(() => setSettings(null));
    if (user) {
      apiFetch<{ vehicles: typeof vehicles }>("/api/vehicles")
        .then((d) => {
          setVehicles(d.vehicles);
          const active = d.vehicles.find((v) => v.isActive);
          if (active) setVehicleId(active.id);
        })
        .catch(() => {});
    }
  }, [user]);

  const price = useMemo(() => {
    if (!settings) return null;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const [y, m, d] = date.split("-").map(Number);
    const start = new Date(y, m - 1, d, sh, sm);
    const end = new Date(y, m - 1, d, eh, em);
    if (end <= start) return null;
    const minutes = Math.ceil((end.getTime() - start.getTime()) / 60000 / 30) * 30;
    const hours = minutes / 60;
    const base = Math.round(hours * space.pricePerHour * 100) / 100;
    const fee = Math.round(base * settings.feeRate * 100) / 100;
    const tax = Math.round((base + fee) * settings.taxRate * 100) / 100;
    const total = Math.round((base + fee + tax + settings.convenienceFee) * 100) / 100;
    return { minutes, base, fee, tax, convenienceFee: settings.convenienceFee, total };
  }, [date, startTime, endTime, space.pricePerHour, settings]);

  async function book() {
    if (!vehicleId) {
      setError("Add a vehicle first — go to My Dashboard → Vehicles.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const [y, m, d] = date.split("-").map(Number);
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const data = await apiFetch<{ booking: { id: string; otp?: string }; message: string }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          spaceId: space.id,
          vehicleId,
          startAt: new Date(y, m - 1, d, sh, sm).toISOString(),
          endAt: new Date(y, m - 1, d, eh, em).toISOString(),
        }),
      });
      setResult({ bookingId: data.booking.id, otp: data.booking.otp, message: data.message });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <Card className="p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Price</p>
            <p className="font-display text-3xl font-extrabold text-slate-900">
              {space.currency === "INR" ? "₹" : ""}
              {space.pricePerHour}
              <span className="text-base font-semibold text-slate-400">/hr</span>
            </p>
          </div>
          {space.verificationStatus === "VERIFIED" && <Badge color="green">✓ Verified</Badge>}
        </div>
        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-center">
          <p className="text-sm text-slate-600">Sign in to book this parking space.</p>
          <Link href="/login" className="mt-3 inline-block w-full">
            <Button className="w-full" size="lg">Sign in to book</Button>
          </Link>
          <Link href="/register" className="mt-2 block text-sm font-medium text-brand-600 hover:text-brand-700">
            New here? Create an account
          </Link>
        </div>
      </Card>
    );
  }

  if (result) {
    return (
      <Card className="p-6 shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">✅</div>
          <h3 className="mt-3 font-display text-xl font-extrabold text-slate-900">{result.message}</h3>
          {result.otp && (
            <div className="mt-4 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Your check-in OTP (dev)</p>
              <p className="mt-1 font-mono text-3xl font-extrabold tracking-[0.3em] text-brand-700">{result.otp}</p>
              <p className="mt-1 text-xs text-slate-500">In production this arrives by SMS. The owner will authorize your vehicle.</p>
            </div>
          )}
          <Link href={`/dashboard/bookings/${result.bookingId}`} className="mt-5 inline-block w-full">
            <Button className="w-full" size="lg">View booking & QR code</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Price</p>
          <p className="font-display text-3xl font-extrabold text-slate-900">
            {space.currency === "INR" ? "₹" : ""}
            {space.pricePerHour}
            <span className="text-base font-semibold text-slate-400">/hr</span>
          </p>
        </div>
        <Badge color={space.autoApprove ? "blue" : "amber"}>{space.autoApprove ? "Instant approval" : "Owner approval"}</Badge>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} min={localDate(new Date())} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start</Label>
            <Input type="time" value={startTime} min={`${String(space.openHour).padStart(2, "0")}:00`} max={`${String(Math.max(space.closeHour - 1, 0)).padStart(2, "0")}:59`} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <Label>End</Label>
            <Input type="time" value={endTime} min={startTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Vehicle</Label>
          {vehicles.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
              No vehicles yet.{" "}
              <Link href="/dashboard/vehicles" className="font-medium text-brand-600 hover:underline">
                Add a vehicle →
              </Link>
            </div>
          ) : (
            <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.model} · {v.regNumber} ({v.type}){!v.isActive ? " · inactive" : ""}
                </option>
              ))}
            </Select>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price breakdown</p>
          {price ? (
            <div className="mt-2 space-y-1.5 text-sm">
              <Row label={`Parking fee (${price.minutes} min)`} value={`${space.currency === "INR" ? "₹" : ""}${price.base.toFixed(2)}`} />
              <Row label="Platform fee" value={`${space.currency === "INR" ? "₹" : ""}${price.fee.toFixed(2)}`} />
              <Row label="Taxes" value={`${space.currency === "INR" ? "₹" : ""}${price.tax.toFixed(2)}`} />
              <Row label="Convenience fee" value={`${space.currency === "INR" ? "₹" : ""}${price.convenienceFee.toFixed(2)}`} />
              <div className="my-1 border-t border-slate-200" />
              <div className="flex justify-between font-bold text-slate-900">
                <span>Total</span>
                <span>{space.currency === "INR" ? "₹" : ""}{price.total.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Select a valid time range to see the price.</p>
          )}
        </div>

        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}
        {settings && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">ℹ️ {settings.sandboxPaymentLabel}</p>
        )}

        <Button onClick={book} loading={busy} size="lg" className="w-full" disabled={!vehicleId}>
          Book This Parking
        </Button>
        <p className="text-center text-xs text-slate-400">
          Free cancellation up to {settings?.refundFullHours ?? 24}h before start · 50% refund to 2h before
        </p>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
