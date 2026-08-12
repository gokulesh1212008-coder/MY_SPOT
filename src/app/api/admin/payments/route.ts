import { api, json, apiAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";

export const GET = api(async () => {
  await apiAdmin();
  const payments = await prisma.payment.findMany({
    include: { booking: { include: { space: { select: { title: true } }, user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return json({ payments });
});
