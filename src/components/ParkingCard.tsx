import Link from "next/link";
import Image from "next/image";
import type { SearchResultItem } from "@/lib/types";
import { Badge } from "./ui";

export default function ParkingCard({ item, highlight }: { item: SearchResultItem; highlight?: boolean }) {
  const typeLabel: Record<string, string> = {
    DRIVEWAY: "Driveway",
    GARAGE: "Garage",
    LOT: "Parking lot",
    STREET: "Street space",
  };

  return (
    <Link
      href={`/parking/${item.id}`}
      className={`group block overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/10 ${
        highlight ? "border-brand-400 ring-2 ring-brand-400/30" : "border-slate-200"
      }`}
    >
      <div className="relative h-44 w-full overflow-hidden">
        {item.image ? (
          <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-violet-100 text-5xl">🅿️</div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge color={item.verificationStatus === "VERIFIED" ? "green" : "amber"}>
            {item.verificationStatus === "VERIFIED" ? "✓ Verified" : "Pending verify"}
          </Badge>
          <Badge color="slate">{typeLabel[item.spaceType] ?? item.spaceType}</Badge>
        </div>
        <div className="absolute bottom-3 right-3 rounded-xl bg-slate-950/85 px-3 py-1.5 text-sm font-bold text-white backdrop-blur">
          {item.currency === "INR" ? "₹" : ""}
          {item.pricePerHour}
          <span className="text-xs font-medium text-slate-300">/hr</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-display text-base font-bold text-slate-900 group-hover:text-brand-700">{item.title}</h3>
          <div className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-slate-800">
            <span className="text-amber-400">★</span>
            {item.rating.toFixed(1)}
            <span className="font-normal text-slate-400">({item.ratingCount})</span>
          </div>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {item.hasCCTV && <Badge color="blue">CCTV</Badge>}
          {item.isCovered && <Badge color="blue">Covered</Badge>}
          {item.isIndoor && <Badge color="blue">Indoor</Badge>}
          {item.hasEV && <Badge color="green">EV charge</Badge>}
          {item.allowedTypes.map((t) => (
            <Badge key={t} color="slate">{t}</Badge>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <span className="text-slate-500">
            {item.distanceKm !== null ? `${item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)} m` : `${item.distanceKm.toFixed(1)} km`} away` : item.landmark ?? "Near you"}
          </span>
          <span className="font-medium text-brand-600 group-hover:underline">View & book →</span>
        </div>
      </div>
    </Link>
  );
}
