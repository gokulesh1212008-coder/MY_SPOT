"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import { Button, Card, Input, Label, Select, Badge, EmptyState } from "@/components/ui";

interface Vehicle {
  id: string;
  regNumber: string;
  type: string;
  model: string;
  color: string;
  nickname: string | null;
  isActive: boolean;
}

const typeLabel: Record<string, string> = { BIKE: "Bike", CAR: "Car", SUV: "SUV", TRUCK: "Truck" };

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [regNumber, setRegNumber] = useState("");
  const [type, setType] = useState("CAR");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<{ vehicles: Vehicle[] }>("/api/vehicles");
      setVehicles(d.vehicles);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load vehicles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await apiFetch("/api/vehicles", {
        method: "POST",
        body: JSON.stringify({ regNumber, type, model, color, nickname }),
      });
      setRegNumber("");
      setModel("");
      setColor("");
      setNickname("");
      setMessage("Vehicle added ✓");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add vehicle.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(v: Vehicle) {
    await apiFetch(`/api/vehicles/${v.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !v.isActive }) });
    load();
  }

  async function remove(v: Vehicle) {
    if (!window.confirm(`Remove ${v.model} (${v.regNumber})?`)) return;
    await apiFetch(`/api/vehicles/${v.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-slate-900">My vehicles</h1>
      <p className="mt-1 text-sm text-slate-500">Register the vehicles you use for parking. Each booking is tied to an authorized vehicle.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-slate-900">Add a vehicle</h2>
          <form onSubmit={add} className="mt-4 space-y-4">
            <div>
              <Label>Registration number</Label>
              <Input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="MH01AB1234" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="BIKE">Bike</option>
                  <option value="CAR">Car</option>
                  <option value="SUV">SUV</option>
                  <option value="TRUCK">Truck</option>
                </Select>
              </div>
              <div>
                <Label>Colour</Label>
                <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Red" required />
              </div>
            </div>
            <div>
              <Label>Model</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Maruti Suzuki Swift" required />
            </div>
            <div>
              <Label>Nickname (optional)</Label>
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="My Swift" />
            </div>
            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}
            {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>}
            <Button type="submit" loading={busy} className="w-full">Add vehicle</Button>
          </form>
        </Card>

        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Registered vehicles</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : vehicles.length === 0 ? (
              <EmptyState title="No vehicles yet" body="Add your first vehicle to start booking parking." />
            ) : (
              vehicles.map((v) => (
                <Card key={v.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{v.model}</p>
                      <Badge color={v.isActive ? "green" : "slate"}>{v.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {v.regNumber} · {typeLabel[v.type]} · {v.color}
                      {v.nickname && <span className="text-slate-400"> · “{v.nickname}”</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggle(v)}>
                      {v.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => remove(v)}>✕</Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
