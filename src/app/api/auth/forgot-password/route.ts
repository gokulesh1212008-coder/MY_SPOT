import { NextRequest } from "next/server";
import { api, json, apiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { createHash, randomBytes } from "node:crypto";
import { sendEmail } from "@/lib/notify";

export const POST = api(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) return apiError("Email is required.", 422);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return apiError("No account found with that email.", 404);

  const token = randomBytes(24).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.platformSetting.upsert({
    where: { key: `reset:${user.id}` },
    update: { value: JSON.stringify({ tokenHash, expiresAt: Date.now() + 3600_000 }) },
    create: { key: `reset:${user.id}`, value: JSON.stringify({ tokenHash, expiresAt: Date.now() + 3600_000 }) },
  });

  await sendEmail(email, "MYSPOT password reset", `Reset link (dev): /reset-password?email=${encodeURIComponent(email)}&token=${token}`);
  return json({ ok: true, message: "If that email exists, a reset link has been sent." });
});
