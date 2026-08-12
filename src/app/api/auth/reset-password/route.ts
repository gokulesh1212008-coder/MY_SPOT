import { NextRequest } from "next/server";
import { api, json, apiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createHash } from "node:crypto";

export const POST = api(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");

  if (password.length < 8) return apiError("Password must be at least 8 characters.", 422);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return apiError("Invalid reset link.", 400);

  const row = await prisma.platformSetting.findUnique({ where: { key: `reset:${user.id}` } });
  if (!row) return apiError("Invalid or expired reset link.", 400);

  let data: { tokenHash: string; expiresAt: number };
  try {
    data = JSON.parse(row.value);
  } catch {
    return apiError("Invalid or expired reset link.", 400);
  }
  if (data.expiresAt < Date.now()) return apiError("This reset link has expired. Request a new one.", 400);
  if (data.tokenHash !== createHash("sha256").update(token).digest("hex")) {
    return apiError("Invalid reset link.", 400);
  }

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  await prisma.platformSetting.delete({ where: { key: `reset:${user.id}` } }).catch(() => {});
  await prisma.session.deleteMany({ where: { userId: user.id } });

  return json({ ok: true, message: "Password updated. Please sign in." });
});
