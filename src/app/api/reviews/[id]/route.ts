import { NextRequest } from "next/server";
import { api, json, apiError, apiUser, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";

export const PATCH = api(async (req: NextRequest, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const review = await prisma.review.findUnique({ where: { id }, include: { space: true } });
  if (!review) throw new ApiError("Review not found.", 404);

  // Owner reply
  if (body.ownerReply !== undefined) {
    if (review.space.ownerId !== user.id && !user.isAdmin) {
      throw new ApiError("Only the owner of this parking space can reply.", 403);
    }
    const reply = String(body.ownerReply).trim();
    if (reply.length > 500) return apiError("Reply is too long (max 500 characters).", 422);
    await prisma.review.update({ where: { id }, data: { ownerReply: reply || null } });
    return json({ ok: true });
  }

  // Admin moderation
  if (body.moderated !== undefined) {
    if (!user.isAdmin) throw new ApiError("Admin access required.", 403);
    await prisma.review.update({ where: { id }, data: { moderated: Boolean(body.moderated) } });
    const agg = await prisma.review.aggregate({
      where: { spaceId: review.spaceId, moderated: false },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.parkingSpace.update({
      where: { id: review.spaceId },
      data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingCount: agg._count },
    });
    return json({ ok: true });
  }

  return apiError("Nothing to update.", 400);
});
