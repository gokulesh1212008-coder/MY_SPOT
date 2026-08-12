import { NextRequest } from "next/server";
import { api, json, apiError } from "@/lib/api";
import { verifyPassword, createSession, publicUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const POST = api(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) return apiError("Email and password are required.", 422);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return apiError("Invalid email or password.", 401);
  }

  await createSession(user.id);
  await logAudit({ userId: user.id, action: "login", result: "success" });

  return json({ user: publicUser(user) });
});
