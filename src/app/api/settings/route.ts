import { api, json } from "@/lib/api";
import { getSettings } from "@/lib/settings";

export const GET = api(async () => {
  const s = await getSettings();
  return json({
    settings: {
      commissionRate: s.commissionRate,
      feeRate: s.feeRate,
      taxRate: s.taxRate,
      convenienceFee: s.convenienceFee,
      refundFullHours: s.refundFullHours,
      refundHalfHours: s.refundHalfHours,
      maxBookingHours: s.maxBookingHours,
      currency: s.currency,
      sandboxPaymentLabel: s.sandboxPaymentLabel,
    },
  });
});
