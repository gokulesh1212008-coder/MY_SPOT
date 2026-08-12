"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiFetch } from "@/lib/http";
import { Button, Card, EmptyState, Badge } from "@/components/ui";

interface Fav {
  id: string;
  space: {
    id: string;
    title: string;
    address: string;
    pricePerHour: number;
    currency: string;
    rating: number;
    ratingCount: number;
    verificationStatus: string;
    images: { url: string; isPrimary: boolean }[];
  };
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Fav[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<{ favorites: Fav[] }>("/api/favorites");
      setFavorites(d.favorites);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    await apiFetch(`/api/parking/${id}/favorite`, { method: "POST" });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-slate-900">Favorite parking spaces</h1>
      <p className="mt-1 text-sm text-slate-500">Quick access to spaces you loved.</p>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : favorites.length === 0 ? (
          <EmptyState
            title="No favorites yet"
            body="Tap the ⭐ on any parking space to save it here for quick booking."
            action={
              <Link href="/parking">
                <Button>Browse parking</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((f) => (
              <Card key={f.id} className="overflow-hidden">
                <Link href={`/parking/${f.space.id}`}>
                  <div className="relative h-36 w-full">
                    {f.space.images[0] ? (
                      <Image src={f.space.images[0].url} alt={f.space.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-50 text-4xl">🅿️</div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/parking/${f.space.id}`}>
                      <h3 className="font-semibold text-slate-900 hover:text-brand-700">{f.space.title}</h3>
                    </Link>
                    <button onClick={() => remove(f.space.id)} className="text-amber-400 hover:text-amber-500" aria-label="Remove favorite">
                      ★
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{f.space.address}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">
                      {f.space.currency === "INR" ? "₹" : ""}
                      {f.space.pricePerHour}
                      <span className="text-xs font-normal text-slate-400">/hr</span>
                    </span>
                    <span className="text-xs text-slate-500">★ {f.space.rating.toFixed(1)}</span>
                  </div>
                  {f.space.verificationStatus === "VERIFIED" && <Badge color="green" className="mt-2">✓ Verified</Badge>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
