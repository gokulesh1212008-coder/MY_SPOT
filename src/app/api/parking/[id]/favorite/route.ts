import { NextRequest } from "next/server";
import { api, json, apiUser, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";

export const POST = api(async (_req: NextRequest, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;
  const space = await prisma.parkingSpace.findUnique({ where: { id } });
  if (!space) throw new ApiError("Parking space not found.", 404);

  const existing = await prisma.favorite.findUnique({
    where: { userId_spaceId: { userId: user.id, spaceId: id } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return json({ favorited: false });
  }
  await prisma.favorite.create({ data: { userId: user.id, spaceId: id } });
  return json({ favorited: true });
});
