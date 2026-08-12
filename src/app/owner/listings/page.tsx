import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, Badge, StatusBadge, Button, EmptyState } from "@/components/ui";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const listings = await prisma.parkingSpace.findMany({
    where: { ownerId: user.id },
    include: { images: { take: 1 }, _count: { select: { bookings: true, reviews: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-slate-900">My listings</h2>
      <p className="mt-1 text-sm text-slate-500">Every listing is reviewed by MYSPOT before it earns the Verified badge.</p>

      {listings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No parking spaces listed yet"
            body="List your driveway, garage or society slot and start earning."
            action={
              <Link href="/owner/listings/new">
                <Button>List your first space</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {listings.map((l) => (
            <Card key={l.id} className="overflow-hidden">
              <div className="relative h-40 w-full">
                {l.images[0] ? (
                  <Image src={l.images[0].url} alt={l.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand-50 text-5xl">🅿️</div>
                )}
                <div className="absolute left-3 top-3 flex gap-2">
                  <Badge color={l.verificationStatus === "VERIFIED" ? "green" : "amber"}>{l.verificationStatus}</Badge>
                  <Badge color={l.status === "ACTIVE" ? "blue" : "slate"}>{l.status === "ACTIVE" ? "Live" : "Hidden"}</Badge>
                </div>
                <div className="absolute bottom-3 right-3 rounded-xl bg-slate-950/85 px-3 py-1.5 text-sm font-bold text-white">
                  {formatMoney(l.pricePerHour)}/hr
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-display font-bold text-slate-900">{l.title}</h3>
                <p className="mt-1 line-clamp-1 text-sm text-slate-500">{l.address}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">★ {l.rating.toFixed(1)} · {l._count.bookings} bookings · {l._count.reviews} reviews</span>
                  <span className="flex items-center gap-2">
                    <StatusBadge status={l.status === "ACTIVE" ? "ACTIVE_LISTING" : "INACTIVE"} />
                  </span>
                </div>
                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                  <Link href={`/owner/listings/${l.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full">Edit</Button>
                  </Link>
                  <Link href={`/parking/${l.id}`} className="flex-1">
                    <Button variant="ghost" className="w-full">View page</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
