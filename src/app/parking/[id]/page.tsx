import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getCurrentUser, publicUser } from "@/lib/auth";
import { Badge, Card } from "@/components/ui";
import { StarRating } from "@/components/StarRating";
import BookingWidget from "@/components/BookingWidget";
import MapView from "@/components/DynamicMapView";
import type { ClientUser } from "@/lib/types";

export const metadata = { title: "Parking details — MYSPOT" };

export const dynamic = "force-dynamic";

export default async function ParkingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const space = await prisma.parkingSpace.findUnique({
    where: { id },
    include: {
      images: { orderBy: { isPrimary: "desc" } },
      owner: { select: { id: true, name: true, isVerified: true, phone: true } },
      reviews: {
        where: { moderated: false },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!space || space.status !== "ACTIVE") notFound();

  let allowedTypes: string[] = ["CAR"];
  try {
    allowedTypes = JSON.parse(space.allowedTypes);
  } catch {
    /* ignore */
  }

  const user = await getCurrentUser();
  const clientUser: ClientUser | null = user ? publicUser(user) : null;

  const typeLabel: Record<string, string> = {
    DRIVEWAY: "Driveway",
    GARAGE: "Private garage",
    LOT: "Parking lot",
    STREET: "Street space",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/parking" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Back to search
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        {/* Left: gallery + info */}
        <div className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {space.images.slice(0, 4).map((img, i) => (
              <div key={img.id} className={`relative overflow-hidden rounded-2xl ${i === 0 ? "sm:col-span-2 h-72" : "h-48"}`}>
                <Image src={img.url} alt={`${space.title} photo ${i + 1}`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 66vw" />
              </div>
            ))}
            {space.images.length === 0 && (
              <div className="flex h-72 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-violet-100 text-6xl sm:col-span-2">
                🅿️
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge color={space.verificationStatus === "VERIFIED" ? "green" : "amber"}>
              {space.verificationStatus === "VERIFIED" ? "✓ Verified parking by MYSPOT" : "Verification pending"}
            </Badge>
            <Badge color="slate">{typeLabel[space.spaceType]}</Badge>
            <div className="flex items-center gap-1">
              <StarRating value={space.rating} />
              <span className="text-sm font-semibold text-slate-800">{space.rating.toFixed(1)}</span>
              <span className="text-sm text-slate-400">({space.ratingCount} reviews)</span>
            </div>
          </div>

          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900">{space.title}</h1>
          <p className="mt-2 text-slate-500">
            📍 {space.address}
            {space.landmark && <span className="text-slate-400"> · {space.landmark}</span>}
          </p>
          <p className="mt-4 leading-relaxed text-slate-600">{space.description}</p>

          {/* Facilities */}
          <div className="mt-8">
            <h2 className="font-display text-lg font-bold text-slate-900">What you get</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { ok: true, label: "Open daily", icon: "🗓️" },
                { ok: true, label: `${space.openHour}:00 – ${space.closeHour === 24 ? "24:00" : `${space.closeHour}:00`}`, icon: "🕐" },
                { ok: space.isCovered, label: "Covered", icon: "☂️" },
                { ok: space.isIndoor, label: "Indoor", icon: "🏠" },
                { ok: space.hasCCTV, label: "CCTV monitored", icon: "📹" },
                { ok: space.hasLighting, label: "Well lit", icon: "💡" },
                { ok: space.hasEV, label: "EV charging", icon: "⚡" },
                { ok: true, label: `Fits: ${allowedTypes.join(", ")}`, icon: "🚗" },
                { ok: space.autoApprove, label: space.autoApprove ? "Instant approval" : "Owner approval required", icon: "✅" },
              ].map((f) => (
                <div key={f.label} className={`flex items-center gap-2.5 rounded-xl border p-3 text-sm ${f.ok ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 text-slate-400 line-through"}`}>
                  <span>{f.icon}</span>
                  <span className="font-medium">{f.label}</span>
                </div>
              ))}
            </div>
            {space.maxDimensions && (
              <p className="mt-3 text-sm text-slate-500">Max vehicle dimensions: <span className="font-semibold text-slate-700">{space.maxDimensions}</span></p>
            )}
          </div>

          {/* Rules & policy */}
          <Card className="mt-8 p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Good to know</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>🔐 Check-in uses a secure OTP — the owner authorizes your vehicle before you park.</li>
              <li>💳 Full refund if cancelled ≥ 24h before start; 50% from 24h to 2h; none within 2h.</li>
              <li>⏱️ Extend in-app if the next slot is free; fair overtime charge applies otherwise.</li>
              <li>🛡️ Incidents can be reported from your booking — admins investigate with a full audit trail.</li>
            </ul>
          </Card>

          {/* Reviews */}
          <div className="mt-8">
            <h2 className="font-display text-lg font-bold text-slate-900">Reviews ({space.reviews.length})</h2>
            {space.reviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No reviews yet. Be the first to book and share your experience.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {space.reviews.map((r) => (
                  <Card key={r.id} className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{r.user.name}</p>
                        <StarRating value={r.rating} />
                      </div>
                      <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    {r.comment && <p className="mt-3 text-sm text-slate-600">{r.comment}</p>}
                    {r.ownerReply && (
                      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                        <span className="font-semibold text-slate-700">Owner reply:</span>{" "}
                        <span className="text-slate-600">{r.ownerReply}</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: booking widget + map */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <BookingWidget
            space={{
              id: space.id,
              title: space.title,
              pricePerHour: space.pricePerHour,
              currency: space.currency,
              openHour: space.openHour,
              closeHour: space.closeHour,
              autoApprove: space.autoApprove,
              lat: space.lat,
              lng: space.lng,
              verificationStatus: space.verificationStatus,
            }}
            user={clientUser}
          />
          <MapView
            markers={[{ id: space.id, lat: space.lat, lng: space.lng, title: space.title, price: space.pricePerHour, currency: space.currency }]}
            center={{ lat: space.lat, lng: space.lng }}
            height={260}
          />
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-700">Hosted by</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 font-bold text-white">
                {space.owner.name.charAt(0)}
              </span>
              <div>
                <p className="font-medium text-slate-900">
                  {space.owner.name}
                  {space.owner.isVerified && <span className="ml-1 text-xs font-bold text-emerald-600">✓</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {space.verificationStatus === "VERIFIED" ? "Verified parking host" : "New host"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
