import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, StatCard, StatusBadge } from "@/components/ui";
import { formatMoney, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [users, drivers, owners, spaces, pendingSpaces, bookings, todayBookings, completed, revenue, payouts, incidents, openIncidents, refunds] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isAdmin: false, isOwner: false } }),
    prisma.user.count({ where: { isOwner: true } }),
    prisma.parkingSpace.count(),
    prisma.parkingSpace.count({ where: { verificationStatus: "PENDING" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.payment.aggregate({ where: { status: "SUCCESS", type: "BOOKING" }, _sum: { amount: true } }),
    prisma.payout.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
    prisma.incident.count(),
    prisma.incident.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW", "INVESTIGATING"] } } }),
    prisma.payment.aggregate({ where: { type: "REFUND", status: "REFUNDED" }, _sum: { amount: true } }),
  ]);

  const recentBookings = await prisma.booking.findMany({
    include: { space: { select: { title: true } }, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const popular = await prisma.parkingSpace.findMany({
    include: { _count: { select: { bookings: true } } },
    orderBy: { bookings: { _count: "desc" } },
    take: 5,
  });

  const maxBookings = Math.max(...popular.map((p) => p._count.bookings), 1);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={users} sub={`${drivers} drivers · ${owners} owners`} icon="👥" />
        <StatCard label="Parking spaces" value={spaces} sub={`${pendingSpaces} awaiting verification`} icon="🅿️" />
        <StatCard label="Bookings" value={bookings} sub={`${todayBookings} today · ${completed} completed`} icon="📅" />
        <StatCard label="Revenue" value={formatMoney(revenue._sum.amount ?? 0)} sub={`₹${refunds._sum.amount ?? 0} refunded`} icon="💰" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">Recent bookings</h2>
            <Link href="/admin/bookings" className="text-sm font-medium text-brand-600 hover:underline">All bookings</Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{b.space.title}</p>
                  <p className="text-xs text-slate-500">{b.user.name} · {formatDateTime(b.startAt)} · {b.bookingRef}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Popular spaces</h2>
            <div className="mt-4 space-y-3">
              {popular.map((p) => (
                <div key={p.id}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate pr-2 font-medium text-slate-700">{p.title}</span>
                    <span className="text-slate-500">{p._count.bookings}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-violet-500" style={{ width: `${(p._count.bookings / maxBookings) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Ops snapshot</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row k="Incidents (open)" v={`${openIncidents} of ${incidents}`} />
              <Row k="Pending payouts" v={formatMoney(payouts._sum.amount ?? 0)} />
              <Row k="Avg booking value" v={formatMoney(completed ? Math.round(((revenue._sum.amount ?? 0) / completed) * 100) / 100 : 0)} />
              <Row k="Platform commission @15%" v={formatMoney(Math.round(((revenue._sum.amount ?? 0) * 0.15) * 100) / 100)} />
            </dl>
            <Link href="/admin/incidents" className="mt-4 block rounded-xl bg-brand-50 px-4 py-3 text-center text-sm font-semibold text-brand-700 transition hover:bg-brand-100">
              Manage incidents →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-semibold text-slate-900">{v}</dd>
    </div>
  );
}
