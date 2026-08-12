import { api, json, apiOwner } from "@/lib/api";
import { prisma } from "@/lib/db";

export const GET = api(async () => {
  const user = await apiOwner();

  const [listings, bookings, completed, payouts] = await Promise.all([
    prisma.parkingSpace.findMany({
      where: { ownerId: user.id },
      include: { _count: { select: { bookings: true, images: true } } },
    }),
    prisma.booking.findMany({
      where: { space: { ownerId: user.id } },
      include: { space: { select: { title: true, pricePerHour: true } } },
      orderBy: { startAt: "desc" },
      take: 500,
    }),
    prisma.booking.findMany({ where: { space: { ownerId: user.id }, status: "COMPLETED" }, select: { ownerAmount: true, endAt: true, startAt: true } }),
    prisma.payout.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sum = (rows: { ownerAmount: number }[]) => rows.reduce((s, r) => s + r.ownerAmount, 0);
  const today = sum(completed.filter((b) => b.endAt >= startOfDay));
  const week = sum(completed.filter((b) => b.endAt >= startOfWeek));
  const month = sum(completed.filter((b) => b.endAt >= startOfMonth));
  const total = sum(completed);

  const activeBookings = bookings.filter((b) => ["CONFIRMED", "CHECKED_IN"].includes(b.status)).length;
  const totalHours = bookings.reduce((s, b) => s + (b.endAt.getTime() - b.startAt.getTime()) / 3600000, 0);

  // Peak hours from check-ins
  const peakMap = new Map<number, number>();
  for (const b of bookings) {
    if (!b.checkInAt) continue;
    const h = b.checkInAt.getHours();
    peakMap.set(h, (peakMap.get(h) ?? 0) + 1);
  }
  const peakHours = [...peakMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([h, count]) => ({ hour: h, count }));

  return json({
    stats: {
      listingsCount: listings.length,
      verifiedListings: listings.filter((l) => l.verificationStatus === "VERIFIED").length,
      totalBookings: bookings.length,
      activeBookings,
      completedBookings: completed.length,
      cancelledBookings: bookings.filter((b) => ["CANCELLED", "REFUNDED"].includes(b.status)).length,
      earningsToday: today,
      earningsWeek: week,
      earningsMonth: month,
      earningsTotal: total,
      pendingPayouts: payouts.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0),
      averageBookingHours: bookings.length ? totalHours / bookings.length : 0,
      peakHours,
    },
    listings,
    payouts,
  });
});
