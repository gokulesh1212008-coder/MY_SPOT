import { api, json, apiAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";

export const GET = api(async () => {
  await apiAdmin();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [users, drivers, owners, spaces, activeSpaces, pendingSpaces, bookings, todayBookings, completed, cancelled, revenue, commission, ownerPayouts, incidents, refunds, reviews] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isAdmin: false, isOwner: false } }),
      prisma.user.count({ where: { isOwner: true } }),
      prisma.parkingSpace.count(),
      prisma.parkingSpace.count({ where: { status: "ACTIVE" } }),
      prisma.parkingSpace.count({ where: { verificationStatus: "PENDING" } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
      prisma.booking.count({ where: { status: { in: ["CANCELLED", "REFUNDED"] } } }),
      prisma.payment.aggregate({ where: { status: "SUCCESS", type: "BOOKING" }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: "SUCCESS", type: "BOOKING" }, _sum: { amount: true } }),
      prisma.payout.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
      prisma.incident.count(),
      prisma.payment.aggregate({ where: { type: "REFUND", status: "REFUNDED" }, _sum: { amount: true } }),
      prisma.review.count({ where: { moderated: false } }),
    ]);

  const revenueTotal = revenue._sum.amount ?? 0;
  const commissionTotal = Math.round((commission._sum.amount ?? 0) * 0.15 * 100) / 100;

  const recentBookings = await prisma.booking.findMany({
    include: { space: { select: { title: true } }, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const popularSpaces = await prisma.parkingSpace.findMany({
    include: { _count: { select: { bookings: true } } },
    orderBy: { bookings: { _count: "desc" } },
    take: 5,
  });

  return json({
    stats: {
      users,
      drivers,
      owners,
      spaces,
      activeSpaces,
      pendingSpaces,
      bookings,
      todayBookings,
      completedBookings: completed,
      cancelledBookings: cancelled,
      revenue: revenueTotal,
      commission: commissionTotal,
      ownerPayoutsPending: ownerPayouts._sum.amount ?? 0,
      incidents,
      refunds: refunds._sum.amount ?? 0,
      reviewsToModerate: reviews,
      averageBookingValue: completed ? Math.round((revenueTotal / completed) * 100) / 100 : 0,
    },
    recentBookings,
    popularSpaces,
  });
});
