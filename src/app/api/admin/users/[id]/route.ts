import { NextRequest } from "next/server";
import { api, json, apiError, apiAdmin, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

export const PATCH = api(async (req: NextRequest, ctx) => {
  const admin = await apiAdmin();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError("User not found.", 404);
  if (user.id === admin.id && (body.isAdmin === false || body.isOwner === false)) {
    return apiError("You cannot remove your own admin/owner access.", 422);
  }

  const data: Prisma.UserUpdateInput = {};
  if (body.isOwner !== undefined) data.isOwner = Boolean(body.isOwner);
  if (body.isAdmin !== undefined) data.isAdmin = Boolean(body.isAdmin);
  if (body.isVerified !== undefined) data.isVerified = Boolean(body.isVerified);

  const updated = await prisma.user.update({ where: { id }, data });
  await logAudit({ userId: admin.id, action: "admin.user_updated", targetType: "user", targetId: id, result: JSON.stringify(data) });
  return json({ user: updated });
});
