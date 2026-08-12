"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import { Button, Card, Select, Textarea, StatusBadge, EmptyState } from "@/components/ui";

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
  misuse: "Misuse",
  other: "Other",
};

const statuses = ["OPEN", "UNDER_REVIEW", "INVESTIGATING", "RESOLVED", "CLOSED"];

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  async function update(inc: Incident, patch: Record<string, unknown>) {
    try {
      await apiFetch(`/api/admin/incidents/${inc.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-slate-900">Incidents</h2>
      <p className="mt-1 text-sm text-slate-500">
        Investigate and resolve reports. Every status change is notified to the reporter and logged.
      </p>
      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : incidents.length === 0 ? (
          <EmptyState title="No incidents" body="Reports filed by users will appear here." />
        ) : (
          incidents.map((inc) => (
            <Card key={inc.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">
                      {typeLabel[inc.type] ?? inc.type} <span className="text-xs font-normal text-slate-400">· {inc.ref}</span>
                    </p>
                    <StatusBadge status={inc.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{inc.description}</p>
                  <p className="mt-1 text-xs text-slate-400">Reported {new Date(inc.createdAt).toLocaleString("en-IN")}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Select value={inc.status} onChange={(e) => update(inc, { status: e.target.value })} className="w-44">
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </Select>
                  <Textarea
                    defaultValue={inc.resolution ?? ""}
                    placeholder="Resolution notes…"
                    rows={2}
                    onBlur={(e) => {
                      if (e.target.value !== (inc.resolution ?? "")) update(inc, { resolution: e.target.value });
                    }}
                    className="text-xs"
                  />
                  <Button size="sm" variant="outline" onClick={() => update(inc, { status: "RESOLVED" })}>
                    Mark resolved
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
