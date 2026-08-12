"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import { Button, Card, Select, Textarea, Input, EmptyState, StatusBadge } from "@/components/ui";

interface Incident {
  id: string;
  ref: string;
  type: string;
  description: string;
  status: string;
  resolution: string | null;
  createdAt: string;
}

const typeLabel: Record<string, string> = {
  unauthorized_vehicle: "Unauthorized vehicle",
  parking_dispute: "Parking dispute",
  damage: "Damage",
  safety_concern: "Safety concern",
  access_problem: "Access problem",
  payment_issue: "Payment issue",
  booking_issue: "Booking issue",
  misuse: "Misuse of parking",
  other: "Other",
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("unauthorized_vehicle");
  const [description, setDescription] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<{ incidents: Incident[] }>("/api/incidents");
      setIncidents(d.incidents);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to report incident.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-slate-900">Incidents & support</h1>
      <p className="mt-1 text-sm text-slate-500">
        Report unauthorized vehicles, damage, safety concerns or payment issues. Every report is investigated with a full audit trail.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-slate-900">Report an incident</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {Object.entries(typeLabel).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Booking reference (optional)</label>
              <Input value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} placeholder="MSP-000123" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">What happened?</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the incident with as much detail as possible…" required minLength={10} />
            </div>
            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}
            {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>}
            <Button type="submit" loading={busy} className="w-full">Submit report</Button>
          </form>
        </Card>

        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Your reports</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : incidents.length === 0 ? (
              <EmptyState title="No incidents reported" body="Reports you file will appear here with live status updates." />
            ) : (
              incidents.map((inc) => (
                <Card key={inc.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">
                      {typeLabel[inc.type] ?? inc.type} <span className="text-xs font-normal text-slate-400">· {inc.ref}</span>
                    </p>
                    <StatusBadge status={inc.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{inc.description}</p>
                  {inc.resolution && (
                    <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      <span className="font-semibold">Resolution:</span> {inc.resolution}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    Reported {new Date(inc.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
