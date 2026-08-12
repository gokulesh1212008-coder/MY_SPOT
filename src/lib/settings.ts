import { prisma } from "./db";
import { DEFAULT_PRICING } from "./pricing";

export interface PlatformSettings {
  commissionRate: number;
  feeRate: number;
  taxRate: number;
  convenienceFee: number;
  refundFullHours: number;
  refundHalfHours: number;
  maxBookingHours: number;
  cancelGraceMinutes: number;
  currency: string;
  sandboxPaymentLabel: string;
}

export const DEFAULT_SETTINGS: PlatformSettings = {
  commissionRate: DEFAULT_PRICING.commissionRate,
  feeRate: DEFAULT_PRICING.feeRate,
  taxRate: DEFAULT_PRICING.taxRate,
  convenienceFee: DEFAULT_PRICING.convenienceFee,
  refundFullHours: DEFAULT_PRICING.refundFullHours,
  refundHalfHours: DEFAULT_PRICING.refundHalfHours,
  maxBookingHours: 72,
  cancelGraceMinutes: 15,
  currency: "INR",
  sandboxPaymentLabel: "Sandbox payment (no real money) — connect Stripe/Razorpay via env vars for live payments.",
};

/**
 * Settings resolution: database rows (admin-configured) win, then env vars
 * (deployment defaults, MSPOT_*), then built-in defaults. Never hard-coded.
 */
export async function getSettings(): Promise<PlatformSettings> {
  const rows = await prisma.platformSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const num = (key: keyof PlatformSettings, fallback: number): number => {
    const db = map.get(String(key));
    if (db !== undefined && db !== "") {
      const n = Number(db);
      if (!Number.isNaN(n)) return n;
    }
    const env = process.env[`MSPOT_${String(key).toUpperCase()}`];
    if (env !== undefined && env !== "") {
      const n = Number(env);
      if (!Number.isNaN(n)) return n;
    }
    return fallback;
  };

  const s: PlatformSettings = { ...DEFAULT_SETTINGS };
  s.commissionRate = num("commissionRate", s.commissionRate);
  s.feeRate = num("feeRate", s.feeRate);
  s.taxRate = num("taxRate", s.taxRate);
  s.convenienceFee = num("convenienceFee", s.convenienceFee);
  s.refundFullHours = num("refundFullHours", s.refundFullHours);
  s.refundHalfHours = num("refundHalfHours", s.refundHalfHours);
  s.maxBookingHours = num("maxBookingHours", s.maxBookingHours);
  s.cancelGraceMinutes = num("cancelGraceMinutes", s.cancelGraceMinutes);
  const currency = map.get("currency") ?? process.env.MSPOT_CURRENCY;
  if (currency) s.currency = currency;
  const label = map.get("sandboxPaymentLabel");
  if (label) s.sandboxPaymentLabel = label;
  return s;
}

export async function updateSettings(partial: Partial<PlatformSettings>): Promise<PlatformSettings> {
  const entries = Object.entries(partial) as [keyof PlatformSettings, unknown][];
  for (const [key, value] of entries) {
    if (typeof value === "number") {
      await prisma.platformSetting.upsert({
        where: { key: String(key) },
        update: { value: String(value) },
        create: { key: String(key), value: String(value) },
      });
    } else if (typeof value === "string") {
      await prisma.platformSetting.upsert({
        where: { key: String(key) },
        update: { value },
        create: { key: String(key), value },
      });
    }
  }
  return getSettings();
}
