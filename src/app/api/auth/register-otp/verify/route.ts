import { NextRequest } from "next/server";
import { api, json, apiError } from "@/lib/api";
import { verifyRegistrationOtp } from "@/lib/regotp";

export const POST = api(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone ?? "").trim().replace(/[\s()-]/g, "");
  const code = String(body.code ?? "").trim();

  if (!/^\d{6}$/.test(code)) {
    return apiError("Enter the 6-digit code you received.", 422);
  }

  const result = await verifyRegistrationOtp(phone, code);
  if (!result.ok) return apiError(result.reason ?? "Verification failed.", 401);

  return json({ ok: true });
});
