import { NextRequest } from "next/server";
import { api, json, apiUser, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

async function ownVehicle(id: string, userId: string) {
  const v = await prisma.vehicle.findUnique({ where: { id } });
  if (!v) throw new ApiError("Vehicle not found.", 404);
  if (v.userId !== userId) throw new ApiError("You can only manage your own vehicles.", 403);
  return v;
}

export const PATCH = api(async (req: NextRequest, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;
  await ownVehicle(id, user.id);
  const body = await req.json().catch(() => ({}));
  const data: Prisma.VehicleUpdateInput = {};
  if (body.nickname !== undefined) data.nickname = body.nickname ? String(body.nickname) : null;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.color !== undefined) data.color = String(body.color);
  if (body.model !== undefined) data.model = String(body.model);
  const vehicle = await prisma.vehicle.update({ where: { id }, data });
  return json({ vehicle });
});

export const DELETE = api(async (_req, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;
  await ownVehicle(id, user.id);
  await prisma.vehicle.delete({ where: { id } });
  return json({ ok: true });
});
