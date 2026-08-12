import { NextRequest } from "next/server";
import { api, json, apiError, apiUser, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";

export const POST = api(async (req: NextRequest, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const rating = Number(body.rating);
  const comment = String(body.comment ?? "").trim();

  const booking = await prisma.booking.findUnique({ where: { id }, include: { space: true } });
  if (!booking) throw new ApiError("Booking not found.", 404);
  if (booking.userId !== user.id) throw new ApiError("Only the driver of this booking can review it.", 403);
  if (booking.status !== "COMPLETED") return apiError("You can review a booking only after it is completed.", 422);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return apiError("Rating must be between 1 and 5 stars.", 422);
  if (comment && comment.length > 500) return apiError("Review is too long (max 500 characters).", 422);

  const existing = await prisma.review.findUnique({ where: { bookingId: id } });
  if (existing) return apiError("You already reviewed this booking.", 409);

  const review = await prisma.review.create({
    data: { bookingId: id, userId: user.id, spaceId: booking.spaceId, rating, comment: comment || null },
  });

  // Recompute the space's aggregate rating.
  const agg = await prisma.review.aggregate({
    where: { spaceId: booking.spaceId, moderated: false },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.parkingSpace.update({
    where: { id: booking.spaceId },
    data: {
      rating: Math.round((agg._avg.rating ?? rating) * 10) / 10,
      ratingCount: agg._count,
    },
  });

  await notify(booking.space.ownerId, "New review", `${user.name} rated your parking ${rating}★.`, "review");
  return json({ review }, 201);
});
