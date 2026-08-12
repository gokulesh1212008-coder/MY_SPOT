import { NextRequest } from "next/server";
import { api, json, apiError, apiAdmin } from "@/lib/api";
import { getSettings, updateSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import { logAudit } from "@/lib/audit";

export const GET = api(async () => {
  await apiAdmin();
  const settings = await getSettings();
  return json({ settings, defaults: DEFAULT_SETTINGS });
});

export const PUT = api(async (req: NextRequest) => {
  const admin = await apiAdmin();
  const body = await req.json().catch(() => ({}));

  const numericKeys = [
    "commissionRate",
    "feeRate",
    "taxRate",
    "convenienceFee",
    "refundFullHours",
    "refundHalfHours",
    "maxBookingHours",
    "cancelGraceMinutes",
  ] as const;

  const partial: Record<string, number | string> = {};
  for (const key of numericKeys) {
    if (body[key] !== undefined) {
      const n = Number(body[key]);
      if (!Number.isFinite(n) || n < 0) return apiError(`${key} must be a valid non-negative number.`, 422);
      partial[key] = n;
    }
  }
  if (body.currency !== undefined && typeof body.currency === "string") partial.currency = body.currency.toUpperCase();

  const settings = await updateSettings(partial);
  await logAudit({ userId: admin.id, action: "admin.settings_updated", result: JSON.stringify(partial) });
  return json({ settings });
});
