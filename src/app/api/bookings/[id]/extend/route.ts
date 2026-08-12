import { NextRequest } from "next/server";
import { api, json, apiError, apiUser, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { computePrice } from "@/lib/pricing";
import { BLOCKING_STATUSES, withinOperatingHours, withinMaxDuration } from "@/lib/booking";
import type { BookingStatus } from "@prisma/client";
import { getPaymentProvider } from "@/lib/payments/provider";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

export const POST = api(async (req: NextRequest, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const newEndAt = new Date(body.newEndAt as string);

  if (isNaN(newEndAt.getTime())) return apiError("Provide a valid new end time.", 422);

  const booking = await prisma.booking.findUnique({ where: { id }, include: { space: true } });
  if (!booking) throw new ApiError("Booking not found.", 404);
  if (booking.userId !== user.id) throw new ApiError("Only the driver can extend this booking.", 403);
  if (!["CONFIRMED", "CHECKED_IN"].includes(booking.status)) {
    return apiError("This booking can no longer be extended.", 422);
  }
  if (newEndAt.getTime() <= booking.endAt.getTime()) {
    return apiError("New end time must be after the current end time.", 422);
  }

  const settings = await getSettings();
  if (!withinOperatingHours(booking.startAt, newEndAt, booking.space.openHour, booking.space.closeHour)) {
    return apiError("The extension falls outside the space's operating hours.", 422);
  }
  if (!withinMaxDuration(booking.startAt, newEndAt, settings.maxBookingHours)) {
    return apiError(`Total booking cannot exceed ${settings.maxBookingHours} hours.`, 422);
  }

  // Check no other confirmed booking starts before the new end time.
  const conflicts = await prisma.booking.findMany({
    where: {
      spaceId: booking.spaceId,
      id: { not: booking.id },
      status: { in: [...BLOCKING_STATUSES] as BookingStatus[] },
      startAt: { lt: newEndAt },
      endAt: { gt: booking.endAt },
    },
    select: { id: true },
  });
  if (conflicts.length > 0) {
    return apiError("Another booking starts before this new end time. Extension not possible.", 409);
  }

  const extra = computePrice(booking.space.pricePerHour, booking.endAt, newEndAt, {
    commissionRate: settings.commissionRate,
    feeRate: settings.feeRate,
    taxRate: settings.taxRate,
    convenienceFee: 0,
    refundFullHours: settings.refundFullHours,
    refundHalfHours: settings.refundHalfHours,
  });
  if (extra.totalAmount <= 0) return apiError("Nothing to charge for this extension.", 422);

  const provider = getPaymentProvider();
  const res = await provider.charge({
    amount: extra.totalAmount,
    currency: settings.currency,
    bookingRef: booking.bookingRef,
    description: `MYSPOT extension for ${booking.bookingRef}`,
  });
  if (!res.success) {
    return apiError(res.message || "Extension payment failed.", 402);
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      endAt: newEndAt,
      totalAmount: Math.round((booking.totalAmount + extra.totalAmount) * 100) / 100,
      ownerAmount: Math.round((booking.ownerAmount + extra.ownerAmount) * 100) / 100,
      commissionAmount: Math.round((booking.commissionAmount + extra.commissionAmount) * 100) / 100,
      baseAmount: Math.round((booking.baseAmount + extra.baseAmount) * 100) / 100,
      feeAmount: Math.round((booking.feeAmount + extra.feeAmount) * 100) / 100,
      taxAmount: Math.round((booking.taxAmount + extra.taxAmount) * 100) / 100,
      extendedFrom: booking.extendedFrom ?? null,
    },
  });
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: provider.name,
      providerRef: res.providerRef,
      type: "EXTENSION",
      amount: extra.totalAmount,
      status: "SUCCESS",
    },
  });

  await notify(booking.space.ownerId, "Booking extended", `Booking ${booking.bookingRef} extended until ${newEndAt.toLocaleString()}.`, "booking");
  await logAudit({ userId: user.id, action: "booking.extended", targetType: "booking", targetId: id });

  return json({ message: "Booking extended. Additional charge applied.", booking: updated, extraAmount: extra.totalAmount });
});
