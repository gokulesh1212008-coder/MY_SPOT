import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, StatCard, StatusBadge, Badge, EmptyState, Button } from "@/components/ui";
import { formatMoney, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OwnerOverviewPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [listings, bookings, completed, payouts] = await Promise.all([
    prisma.parkingSpace.findMany({ where: { ownerId: user.id }, include: { _count: { select: { bookings: true } } } }),
    prisma.booking.findMany({
      where: { space: { ownerId: user.id } },
      include: { space: { select: { title: true, currency: true } }, user: { select: { name: true } }, vehicle: true },
      orderBy: { startAt: "desc" },
      take: 8,
    }),
    prisma.booking.findMany({ where: { space: { ownerId: user.id }, status: "COMPLETED" }, select: { ownerAmount: true, endAt: true } }),
    prisma.payout.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const today = completed.filter((b) => b.endAt >= startOfDay).reduce((s, b) => s + b.ownerAmount, 0);
  const week = completed.filter((b) => b.endAt >= startOfWeek).reduce((s, b) => s + b.ownerAmount, 0);
  const month = completed.filter((b) => b.endAt >= startOfMonth).reduce((s, b) => s + b.ownerAmount, 0);
  const total = completed.reduce((s, b) => s + b.ownerAmount, 0);
  const pendingPayouts = payouts.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const pendingApprovals = bookings.filter((b) => b.status === "CONFIRMED" && !b.ownerApproved);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Earnings today" value={formatMoney(today)} icon="📈" />
        <StatCard label="This week" value={formatMoney(week)} icon="🗓️" />
        <StatCard label="This month" value={formatMoney(month)} icon="💰" />
        <StatCard label="Lifetime" value={formatMoney(total)} sub={`${pendingPayouts > 0 ? `${formatMoney(pendingPayouts)} pending payout` : "no pending payouts"}`} icon="🏦" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">Recent bookings</h2>
            <Link href="/owner/bookings" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
          </div>
          {bookings.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              body="List a parking space and drivers will start booking it."
              action={
                <Link href="/owner/listings/new">
                  <Button>List your first space</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <Card key={b.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{b.space.title}</p>
                      <StatusBadge status={b.status} />
                      {b.status === "CONFIRMED" && !b.ownerApproved && <Badge color="amber">Needs approval</Badge>}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {b.user.name} · {formatDateTime(b.startAt)} → {formatDateTime(b.endAt)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {b.vehicle.model} · {b.vehicle.regNumber} · {b.bookingRef}
                    </p>
                  </div>
                  <p className="shrink-0 font-bold text-emerald-600">+{formatMoney(b.ownerAmount, b.space.currency)}</p>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-bold text-slate-900">Your listings</h2>
          <div className="space-y-3">
            {listings.length === 0 ? (
              <Card className="p-5 text-sm text-slate-500">
                No listings yet.{" "}
                <Link href="/owner/listings/new" className="font-medium text-brand-600 hover:underline">
                  Create your first →
                </Link>
              </Card>
            ) : (
              listings.map((l) => (
                <Link key={l.id} href={`/owner/listings/${l.id}/edit`}>
                  <Card className="flex items-center justify-between p-4 transition hover:border-brand-300">
                    <div>
                      <p className="font-semibold text-slate-900">{l.title}</p>
                      <p className="text-xs text-slate-500">
                        {formatMoney(l.pricePerHour)}/hr · {l._count.bookings} bookings
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge color={l.verificationStatus === "VERIFIED" ? "green" : "amber"}>{l.verificationStatus}</Badge>
                      <Badge color={l.status === "ACTIVE" ? "blue" : "slate"}>{l.status}</Badge>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>

          {pendingApprovals.length > 0 && (
            <Link href="/owner/bookings">
              <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-700 transition hover:bg-amber-100">
                ⏳ {pendingApprovals.length} booking{pendingApprovals.length > 1 ? "s" : ""} waiting for your approval →
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
