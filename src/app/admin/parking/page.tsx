"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiFetch } from "@/lib/http";
import { Button, Card, Badge } from "@/components/ui";

interface AdminSpace {
  id: string;
  title: string;
  address: string;
  pricePerHour: number;
  currency: string;
  verificationStatus: string;
  status: string;
  owner: { name: string };
  images: { url: string }[];
}

export default function AdminParkingPage() {
  const [spaces, setSpaces] = useState<AdminSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<{ spaces: AdminSpace[] }>("/api/admin/parking");
      setSpaces(d.spaces);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load parking.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function update(id: string, patch: Record<string, unknown>) {
    try {
      await apiFetch(`/api/admin/parking/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  }

  const filtered = filter === "ALL" ? spaces : spaces.filter((s) => s.verificationStatus === filter);

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-slate-900">Parking verification</h2>
      <p className="mt-1 text-sm text-slate-500">Review owner info, photos and location before granting the Verified badge.</p>

      <div className="mt-4 flex gap-2">
        {["ALL", "PENDING", "VERIFIED", "REJECTED", "SUSPENDED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === f ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-300 hover:border-brand-400"}`}
          >
            {f === "ALL" ? `All (${spaces.length})` : f}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          filtered.map((s) => (
            <Card key={s.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl">
                {s.images[0] ? (
                  <Image src={s.images[0].url} alt={s.title} fill className="object-cover" sizes="96px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand-50 text-2xl">🅿️</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/parking/${s.id}`} className="font-semibold text-slate-900 hover:text-brand-700">{s.title}</Link>
                  <Badge color={s.verificationStatus === "VERIFIED" ? "green" : s.verificationStatus === "PENDING" ? "amber" : "red"}>{s.verificationStatus}</Badge>
                  <Badge color={s.status === "ACTIVE" ? "blue" : "slate"}>{s.status}</Badge>
                </div>
                <p className="truncate text-sm text-slate-500">{s.address}</p>
                <p className="text-xs text-slate-400">Owner: {s.owner.name} · ₹{s.pricePerHour}/hr</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.verificationStatus !== "VERIFIED" && (
                  <Button size="sm" onClick={() => update(s.id, { verificationStatus: "VERIFIED" })}>✓ Verify</Button>
                )}
                {s.verificationStatus !== "REJECTED" && (
                  <Button size="sm" variant="danger" onClick={() => update(s.id, { verificationStatus: "REJECTED" })}>Reject</Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => update(s.id, { status: s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}
                >
                  {s.status === "ACTIVE" ? "Hide" : "Activate"}
                </Button>
                {s.verificationStatus === "VERIFIED" && (
                  <Button size="sm" variant="danger" onClick={() => update(s.id, { verificationStatus: "SUSPENDED" })}>Suspend</Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
