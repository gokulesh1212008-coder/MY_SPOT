import { api, json, apiError, apiUser, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { computePrice, roundTo } from "@/lib/pricing";
import { getPaymentProvider } from "@/lib/payments/provider";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

export const POST = api(async (_req, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;

  const booking = await prisma.booking.findUnique({ where: { id }, include: { space: true } });
  if (!booking) throw new ApiError("Booking not found.", 404);
  if (booking.userId !== user.id && booking.space.ownerId !== user.id && !user.isAdmin) {
    throw new ApiError("You don't have access to this booking.", 403);
  }
  if (booking.status !== "CHECKED_IN" && booking.status !== "CONFIRMED") {
    return apiError("Only checked-in (or confirmed) bookings can be checked out.", 422);
  }

  const now = new Date();
  let overtimeMessage = "";

  // If the driver stayed past the booked end time, charge overtime.
  if (now.getTime() > booking.endAt.getTime()) {
    const settings = await getSettings();
    const extraStart = booking.endAt;
    const price = computePrice(booking.space.pricePerHour, extraStart, now, {
      commissionRate: settings.commissionRate,
      feeRate: settings.feeRate,
      taxRate: settings.taxRate,
      convenienceFee: 0,
      refundFullHours: settings.refundFullHours,
      refundHalfHours: settings.refundHalfHours,
    });
    if (price.minutes >= 30 && price.totalAmount > 0) {
      const provider = getPaymentProvider();
      const res = await provider.charge({
        amount: price.totalAmount,
        currency: settings.currency,
        bookingRef: booking.bookingRef,
        description: `MYSPOT overtime for ${booking.bookingRef} (${roundTo(price.minutes)} min)`,
      });
      if (res.success) {
        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            provider: provider.name,
            providerRef: res.providerRef,
            type: "EXTENSION",
            amount: price.totalAmount,
            status: "SUCCESS",
          },
        });
        overtimeMessage = ` You were charged ${settings.currency === "INR" ? "₹" : ""}${price.totalAmount.toFixed(0)} for overtime.`;
      }
    }
  }

  const done = await prisma.booking.update({ where: { id }, data: { status: "COMPLETED", checkOutAt: now } });
  await notify(booking.space.ownerId, "Vehicle checked out", `Booking ${booking.bookingRef} completed.`, "booking");
  await logAudit({ userId: user.id, action: "booking.checkout", targetType: "booking", targetId: id, result: "completed" });

  return json({ message: "Check-out complete. Thanks for using MYSPOT!" + overtimeMessage, booking: done });
});
