export interface PricingConfig {
  commissionRate: number; // owner commission, 0.15 = 15%
  feeRate: number; // platform convenience fee as fraction of base
  taxRate: number; // GST-like tax as fraction of (base + fee)
  convenienceFee: number; // flat fee added
  refundFullHours: number; // >= this many hours before start => 100% refund
  refundHalfHours: number; // >= this many hours before start => 50% refund
}

export const DEFAULT_PRICING: PricingConfig = {
  commissionRate: 0.15,
  feeRate: 0.05,
  taxRate: 0.18,
  convenienceFee: 10,
  refundFullHours: 24,
  refundHalfHours: 2,
};

export function roundTo(minutes: number, stepMinutes = 30): number {
  if (minutes <= 0) return 0;
  return Math.ceil(minutes / stepMinutes) * stepMinutes;
}

export interface PriceBreakdown {
  minutes: number;
  hours: number;
  baseAmount: number;
  feeAmount: number;
  taxAmount: number;
  convenienceFee: number;
  discountAmount: number;
  totalAmount: number;
  ownerAmount: number;
  commissionAmount: number;
}

export function computePrice(
  pricePerHour: number,
  startAt: Date,
  endAt: Date,
  config: PricingConfig = DEFAULT_PRICING
): PriceBreakdown {
  const minutes = roundTo(Math.max(0, (endAt.getTime() - startAt.getTime()) / 60000));
  const hours = minutes / 60;
  const baseAmount = Math.round(hours * pricePerHour * 100) / 100;
  const feeAmount = Math.round(baseAmount * config.feeRate * 100) / 100;
  const taxAmount = Math.round((baseAmount + feeAmount) * config.taxRate * 100) / 100;
  const convenienceFee = config.convenienceFee;
  const discountAmount = 0;
  const totalAmount = Math.round((baseAmount + feeAmount + taxAmount + convenienceFee - discountAmount) * 100) / 100;
  const commissionAmount = Math.round(baseAmount * config.commissionRate * 100) / 100;
  const ownerAmount = Math.round((baseAmount - commissionAmount) * 100) / 100;

  return {
    minutes,
    hours,
    baseAmount,
    feeAmount,
    taxAmount,
    convenienceFee,
    discountAmount,
    totalAmount,
    ownerAmount,
    commissionAmount,
  };
}

export type RefundTier = "FULL" | "HALF" | "NONE";

export function refundTier(now: Date, startAt: Date, config: PricingConfig = DEFAULT_PRICING): RefundTier {
  const hoursBefore = (startAt.getTime() - now.getTime()) / 3600000;
  if (hoursBefore >= config.refundFullHours) return "FULL";
  if (hoursBefore >= config.refundHalfHours) return "HALF";
  return "NONE";
}

export function refundAmount(tier: RefundTier, paidAmount: number): number {
  if (tier === "FULL") return paidAmount;
  if (tier === "HALF") return Math.round(paidAmount * 0.5 * 100) / 100;
  return 0;
}
