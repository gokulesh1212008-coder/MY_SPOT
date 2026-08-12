import { api, json, apiAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";

export const GET = api(async () => {
  await apiAdmin();
  const users = await prisma.user.findMany({
    include: { _count: { select: { bookings: true, parkingSpaces: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return json({ users });
});
