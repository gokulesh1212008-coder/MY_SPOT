import { NextRequest } from "next/server";
import { api, json, apiError, apiUser } from "@/lib/api";
import { prisma } from "@/lib/db";

const TYPES = [
  "unauthorized_vehicle",
  "parking_dispute",
  "damage",
  "safety_concern",
  "access_problem",
  "payment_issue",
  "booking_issue",
  "misuse",
  "other",
];

export const GET = api(async () => {
  const user = await apiUser();
  const incidents = await prisma.incident.findMany({
    where: user.isAdmin ? {} : { reportedById: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return json({ incidents });
});

export const POST = api(async (req: NextRequest) => {
  const user = await apiUser();
  const body = await req.json().catch(() => ({}));
  const type = String(body.type ?? "");
  const description = String(body.description ?? "").trim();
  const bookingId = body.bookingId ? String(body.bookingId) : null;

  if (!TYPES.includes(type)) return apiError("Select a valid incident type.", 422);
  if (description.length < 10) return apiError("Please describe the incident in at least 10 characters.", 422);

  let spaceId: string | null = null;
  if (bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { space: true } });
    if (!booking) return apiError("Booking not found.", 404);
    if (booking.userId !== user.id && booking.space.ownerId !== user.id && !user.isAdmin) {
      return apiError("You can only report incidents on your own bookings or parking spaces.", 403);
    }
    spaceId = booking.spaceId;
  }

  const incident = await prisma.incident.create({
    data: {
      ref: `INC-${Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0")}`,
      reportedById: user.id,
      bookingId,
      spaceId,
      type,
      description,
    },
  });

  return json({ incident }, 201);
});
