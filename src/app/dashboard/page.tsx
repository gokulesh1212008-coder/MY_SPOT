import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, StatCard, StatusBadge, Badge, Button } from "@/components/ui";
import { formatDateTime, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [bookings, vehicles, favorites, notifications, upcoming] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: user.id },
      include: { space: { include: { images: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.vehicle.count({ where: { userId: user.id } }),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.booking.findMany({
      where: { userId: user.id, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
      include: { space: true },
      orderBy: { startAt: "asc" },
      take: 3,
    }),
  ]);

  const next = upcoming[0];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Welcome back, {user.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s happening with your parking.</p>
        </div>
        <Link href="/parking">
          <Button>Find parking</Button>
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Upcoming bookings" value={upcoming.length} icon="📅" />
        <StatCard label="Total bookings" value={bookings.length} icon="🗂️" />
        <StatCard label="Vehicles" value={vehicles} icon="🚗" />
        <StatCard label="Saved spaces" value={favorites} icon="⭐" />
      </div>

      {next && (
        <Card className="mt-6 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-600 to-violet-600 p-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-brand-100">Next booking</p>
                <p className="mt-1 font-display text-xl font-extrabold">{next.space.title}</p>
                <p className="mt-0.5 text-sm text-brand-100">
                  {formatDateTime(next.startAt)} → {formatDateTime(next.endAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={next.status} />
                <Link href={`/dashboard/bookings/${next.id}`}>
                  <span className="rounded-xl bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur transition hover:bg-white/30">
                    Manage →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">Recent bookings</h2>
            <Link href="/dashboard/bookings" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
          </div>
          {bookings.length === 0 ? (
            <Card className="p-6 text-sm text-slate-500">No bookings yet. Find a space and book your first parking!</Card>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <Link key={b.id} href={`/dashboard/bookings/${b.id}`}>
                  <Card className="flex items-center justify-between p-4 transition hover:border-brand-300 hover:shadow-md">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{b.space.title}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(b.startAt)} · {b.bookingRef}</p>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{formatMoney(b.totalAmount, b.space.currency)}</span>
                      <StatusBadge status={b.status} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">Notifications</h2>
            <Link href="/dashboard/notifications" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
          </div>
          {notifications.length === 0 ? (
            <Card className="p-6 text-sm text-slate-500">You&apos;re all caught up!</Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <Card key={n.id} className={`p-4 ${n.read ? "opacity-70" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg">🔔</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>
                    </div>
                    {!n.read && <Badge color="blue">New</Badge>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
