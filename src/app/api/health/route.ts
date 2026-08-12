import { api, json } from "@/lib/api";
import { prisma } from "@/lib/db";

export const GET = api(async () => {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return json(
    { status: dbOk ? "ok" : "degraded", service: "myspot", time: new Date().toISOString(), db: dbOk ? "up" : "down" },
    dbOk ? 200 : 503
  );
});
