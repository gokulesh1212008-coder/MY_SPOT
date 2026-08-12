"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/http";
import { Button, Card, Input, Label, Select, Textarea, Badge } from "./ui";
import ClickMap from "./DynamicClickMap";

export interface ListingValues {
  id?: string;
  title: string;
  description: string;
  lat: number | null;
  lng: number | null;
  address: string;
  landmark: string;
  spaceType: string;
  allowedTypes: string[];
  maxDimensions: string;
  isCovered: boolean;
  isIndoor: boolean;
  hasCCTV: boolean;
  hasLighting: boolean;
  hasEV: boolean;
  pricePerHour: string;
  openHour: string;
  closeHour: string;
  autoApprove: boolean;
}

const EMPTY: ListingValues = {
  title: "",
  description: "",
  lat: null,
  lng: null,
  address: "",
  landmark: "",
  spaceType: "DRIVEWAY",
  allowedTypes: ["CAR", "BIKE"],
  maxDimensions: "",
  isCovered: false,
  isIndoor: false,
  hasCCTV: false,
  hasLighting: true,
  hasEV: false,
  pricePerHour: "50",
  openHour: "6",
  closeHour: "23",
  autoApprove: true,
};

export default function ListingForm({ initial }: { initial?: Partial<ListingValues> }) {
  const router = useRouter();
  const [form, setForm] = useState<ListingValues>({ ...EMPTY, ...initial, allowedTypes: initial?.allowedTypes ?? EMPTY.allowedTypes });
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.id ? [] : []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set<K extends keyof ListingValues>(key: K, value: ListingValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleType(t: string) {
    set(
      "allowedTypes",
      form.allowedTypes.includes(t) ? form.allowedTypes.filter((x) => x !== t) : [...form.allowedTypes, t]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        lat: form.lat,
        lng: form.lng,
        address: form.address,
        landmark: form.landmark || undefined,
        spaceType: form.spaceType,
        allowedTypes: form.allowedTypes,
        maxDimensions: form.maxDimensions || undefined,
        isCovered: form.isCovered,
        isIndoor: form.isIndoor,
        hasCCTV: form.hasCCTV,
        hasLighting: form.hasLighting,
        hasEV: form.hasEV,
        pricePerHour: form.pricePerHour,
        openHour: form.openHour,
        closeHour: form.closeHour,
        autoApprove: form.autoApprove,
        ...(imageUrls.length ? { images: imageUrls } : {}),
      };
      if (form.id) {
        await apiFetch(`/api/parking/${form.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        router.push("/owner/listings");
      } else {
        const d = await apiFetch<{ space: { id: string } }>("/api/parking", { method: "POST", body: JSON.stringify(payload) });
        router.push(`/owner/listings/${d.space.id}/edit?created=1`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save listing.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="font-display text-lg font-bold text-slate-900">Basics</h3>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Secure Driveway — Colaba" required minLength={4} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Describe the space: access, lighting, security, what drivers should know…" required minLength={20} />
            </div>
            <div>
              <Label>Parking type</Label>
              <Select value={form.spaceType} onChange={(e) => set("spaceType", e.target.value)}>
                <option value="DRIVEWAY">Driveway</option>
                <option value="GARAGE">Private garage</option>
                <option value="LOT">Parking lot / society slot</option>
                <option value="STREET">Street space</option>
              </Select>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="House no, street, area, city" required />
            </div>
            <div>
              <Label>Nearby landmark (optional)</Label>
              <Input value={form.landmark} onChange={(e) => set("landmark", e.target.value)} placeholder="e.g. 200 m from Gateway of India" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display text-lg font-bold text-slate-900">Pricing & hours</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <Label>Price per hour (₹)</Label>
              <Input type="number" min="1" value={form.pricePerHour} onChange={(e) => set("pricePerHour", e.target.value)} required />
            </div>
            <div>
              <Label>Max vehicle dimensions (optional)</Label>
              <Input value={form.maxDimensions} onChange={(e) => set("maxDimensions", e.target.value)} placeholder="e.g. 2.5m × 5m" />
            </div>
            <div>
              <Label>Opens at (hour)</Label>
              <Select value={form.openHour} onChange={(e) => set("openHour", e.target.value)}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i}:00</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Closes at (hour)</Label>
              <Select value={form.closeHour} onChange={(e) => set("closeHour", e.target.value)}>
                {Array.from({ length: 25 }, (_, i) => (
                  <option key={i} value={i}>{i === 24 ? "24:00 (midnight)" : `${i}:00`}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Label>Compatible vehicles</Label>
            <div className="flex flex-wrap gap-2">
              {["BIKE", "CAR", "SUV", "TRUCK"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    form.allowedTypes.includes(t) ? "border-brand-500 bg-brand-600 text-white" : "border-slate-300 text-slate-600 hover:border-brand-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <Toggle label="Instant approval (drivers can check in right away)" checked={form.autoApprove} onChange={(v) => set("autoApprove", v)} />
            <p className="text-xs text-slate-400">Turn off to review and approve every booking manually.</p>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="font-display text-lg font-bold text-slate-900">Location</h3>
          <div className="mt-4">
            <ClickMap
              value={form.lat !== null && form.lng !== null ? { lat: form.lat, lng: form.lng } : null}
              onChange={(v) => {
                set("lat", v.lat);
                set("lng", v.lng);
              }}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display text-lg font-bold text-slate-900">Facilities & security</h3>
          <div className="mt-4 space-y-2">
            <Toggle label="☂️ Covered parking" checked={form.isCovered} onChange={(v) => set("isCovered", v)} />
            <Toggle label="🏠 Indoor (garage/basement)" checked={form.isIndoor} onChange={(v) => set("isIndoor", v)} />
            <Toggle label="📹 CCTV available" checked={form.hasCCTV} onChange={(v) => set("hasCCTV", v)} />
            <Toggle label="💡 Lighting at night" checked={form.hasLighting} onChange={(v) => set("hasLighting", v)} />
            <Toggle label="⚡ EV charging" checked={form.hasEV} onChange={(v) => set("hasEV", v)} />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display text-lg font-bold text-slate-900">Photos</h3>
          <p className="mt-1 text-xs text-slate-500">Add image URLs for the demo (real upload storage comes with object storage integration).</p>
          <div className="mt-3 flex gap-2">
            <Input
              value={imageUrls[0] ?? ""}
              onChange={(e) => setImageUrls([e.target.value])}
              placeholder="https://…/photo.jpg"
            />
          </div>
        </Card>

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}

        <Button type="submit" loading={busy} size="lg" className="w-full">
          {form.id ? "Save changes" : "List this parking space"}
        </Button>
        <p className="text-center text-xs text-slate-400">
          New listings start with a <Badge color="amber">Pending verification</Badge> status until reviewed by MYSPOT admins.
        </p>
      </div>
    </form>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-4 py-3 transition hover:border-brand-300">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-brand-600" />
    </label>
  );
}
