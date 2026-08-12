import { api, json, apiAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";

export const GET = api(async () => {
  await apiAdmin();
  const spaces = await prisma.parkingSpace.findMany({
    include: { images: true, owner: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return json({ spaces });
});
