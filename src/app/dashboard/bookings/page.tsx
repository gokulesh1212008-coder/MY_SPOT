import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, StatusBadge, EmptyState, Button } from "@/components/ui";
import { formatDateTime, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: { space: true, vehicle: true, review: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-slate-900">My bookings</h1>
      <p className="mt-1 text-sm text-slate-500">Every booking, from confirmation to completion.</p>

      {bookings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No bookings yet"
            body="Find a parking space near your destination and book your first slot."
            action={
              <Link href="/parking">
                <Button>Find parking</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {bookings.map((b) => (
            <Link key={b.id} href={`/dashboard/bookings/${b.id}`}>
              <Card className="flex flex-col gap-4 p-5 transition hover:border-brand-300 hover:shadow-md sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{b.space.title}</h2>
                    <StatusBadge status={b.status} />
                    {b.review && <span className="text-xs text-slate-400">★ reviewed</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDateTime(b.startAt)} → {formatDateTime(b.endAt)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {b.vehicle.model} · {b.vehicle.regNumber} · {b.bookingRef}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatMoney(b.totalAmount, b.space.currency)}</p>
                  <p className="text-xs text-emerald-600 font-medium">Manage →</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
