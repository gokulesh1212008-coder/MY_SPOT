import { NextRequest } from "next/server";
import { api, json, apiError, apiUser } from "@/lib/api";
import { hashPassword, createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";

export const POST = api(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const password = String(body.password ?? "");

  if (!name || name.length < 2) return apiError("Please enter your full name.", 422);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return apiError("Please enter a valid email address.", 422);
  if (password.length < 8) return apiError("Password must be at least 8 characters.", 422);

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return apiError("An account with this email already exists. Try signing in.", 409);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash: await hashPassword(password),
    },
  });

  await createSession(user.id);
  await logAudit({ userId: user.id, action: "register", result: "success" });
  await notify(user.id, "Welcome to MYSPOT 👋", "Your account is ready. Add a vehicle to start booking parking.");

  return json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, isOwner: false, isAdmin: false } }, 201);
});

export const GET = api(async () => {
  const user = await apiUser();
  return json({ authenticated: true, user });
});
