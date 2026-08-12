import { NextRequest } from "next/server";
import { api, json, apiError, apiUser } from "@/lib/api";
import { publicUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

export const PATCH = api(async (req: NextRequest) => {
  const user = await apiUser();
  const body = await req.json().catch(() => ({}));
  const data: Prisma.UserUpdateInput = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) return apiError("Name is too short.", 422);
    data.name = name;
  }
  if (body.phone !== undefined) {
    data.phone = String(body.phone).trim() || null;
  }
  if (body.avatarUrl !== undefined) {
    data.avatarUrl = String(body.avatarUrl).trim() || null;
  }
  if (body.becomeOwner === true && !user.isOwner) {
    data.isOwner = true;
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  await logAudit({ userId: user.id, action: "profile.updated", targetType: "user", targetId: user.id, result: JSON.stringify(Object.keys(data)) });
  return json({ user: publicUser(updated) });
});
