import { api, json, apiUser, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";

export const PATCH = api(async (_req, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n || n.userId !== user.id) throw new ApiError("Notification not found.", 404);
  await prisma.notification.update({ where: { id }, data: { read: true } });
  return json({ ok: true });
});
