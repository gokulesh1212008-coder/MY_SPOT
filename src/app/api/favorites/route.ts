import { api, json, apiUser } from "@/lib/api";
import { prisma } from "@/lib/db";

export const GET = api(async () => {
  const user = await apiUser();
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      space: {
        include: { images: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return json({ favorites });
});
