import { NextRequest } from "next/server";
import { api, json, apiUser } from "@/lib/api";
import { prisma } from "@/lib/db";

export const GET = api(async () => {
  const user = await apiUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = await prisma.notification.count({ where: { userId: user.id, read: false } });
  return json({ notifications, unread });
});

/** Generates "upcoming booking" reminders once per booking. Called by dashboards. */
export const POST = api(async (req: NextRequest) => {
  const user = await apiUser();
  const action = new URL(req.url).searchParams.get("action");
  if (action === "reminders") {
    const soon = new Date(Date.now() + 24 * 3600 * 1000);
    const now = new Date();
    const upcoming = await prisma.booking.findMany({
      where: { userId: user.id, status: "CONFIRMED", startAt: { gte: now, lte: soon } },
      include: { space: true },
    });
    let created = 0;
    for (const b of upcoming) {
      const existing = await prisma.notification.findFirst({
        where: { userId: user.id, type: "reminder", body: { contains: b.bookingRef } },
      });
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "reminder",
            title: "Upcoming parking booking",
            body: `Your booking ${b.bookingRef} at ${b.space.title} starts soon. Don't forget your OTP for check-in.`,
          },
        });
        created++;
      }
    }
    return json({ created });
  }
  return json({ ok: true });
});
