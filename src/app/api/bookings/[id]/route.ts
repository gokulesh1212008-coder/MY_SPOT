import { NextRequest } from "next/server";
import { api, json, apiError, apiUser, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { refundTier, refundAmount } from "@/lib/pricing";
import { getPaymentProvider } from "@/lib/payments/provider";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

async function loadBooking(id: string, user: { id: string; isAdmin: boolean }) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      space: { include: { images: true, owner: { select: { id: true, name: true } } } },
      vehicle: true,
      payments: { orderBy: { createdAt: "desc" } },
      review: true,
    },
  });
  if (!booking) throw new ApiError("Booking not found.", 404);
  const isDriver = booking.userId === user.id;
  const isOwner = booking.space.ownerId === user.id;
  if (!isDriver && !isOwner && !user.isAdmin) throw new ApiError("You don't have access to this booking.", 403);
  return { booking, isDriver, isOwner };
}

export const GET = api(async (_req, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;
  const { booking } = await loadBooking(id, user);
  return json({ booking });
});

export const PATCH = api(async (req: NextRequest, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;
  const { booking, isDriver } = await loadBooking(id, user);

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action !== "cancel") return apiError("Unknown action.", 400);
  if (!isDriver) return apiError("Only the driver can cancel this booking.", 403);

  const CANCELLABLE = ["PENDING", "PAYMENT_PENDING", "CONFIRMED"];
  if (!CANCELLABLE.includes(booking.status)) {
    return apiError("This booking can no longer be cancelled.", 422);
  }
  if (new Date() >= booking.startAt) {
    return apiError("The booking has already started. Check out instead of cancelling.", 422);
  }

  const settings = await getSettings();
  const paid = booking.payments.filter((p) => p.status === "SUCCESS" && p.type !== "REFUND");
  const paidAmount = paid.reduce((s, p) => s + p.amount, 0);
  const tier = refundTier(new Date(), booking.startAt, {
    commissionRate: settings.commissionRate,
    feeRate: settings.feeRate,
    taxRate: settings.taxRate,
    convenienceFee: settings.convenienceFee,
    refundFullHours: settings.refundFullHours,
    refundHalfHours: settings.refundHalfHours,
  });
  const refund = refundAmount(tier, paidAmount);

  let refunded = false;
  if (refund > 0 && paid.length > 0) {
    const provider = getPaymentProvider();
    const res = await provider.refund({
      providerRef: paid[0].providerRef ?? "unknown",
      amount: refund,
      currency: settings.currency,
      reason: `Cancellation (${tier.toLowerCase()} refund)`,
    });
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: provider.name,
        providerRef: res.providerRef,
        type: "REFUND",
        amount: refund,
        status: res.success ? "REFUNDED" : "PENDING",
      },
    });
    refunded = res.success;
  }

  const finalStatus = refunded ? "REFUNDED" : tier === "NONE" ? "CANCELLED" : refund > 0 ? "REFUNDED" : "CANCELLED";
  await prisma.booking.update({
    where: { id },
    data: { status: finalStatus, cancelledAt: new Date(), cancelReason: body.reason ? String(body.reason) : "cancelled_by_driver" },
  });

  await notify(booking.space.ownerId, "Booking cancelled", `Booking ${booking.bookingRef} was cancelled by the driver.`, "booking");
  await logAudit({ userId: user.id, action: "booking.cancelled", targetType: "booking", targetId: id, result: finalStatus });

  return json({
    message:
      refund > 0
        ? `Booking cancelled. ${refund === paidAmount ? "Full" : "Partial"} refund of the paid amount will be returned.`
        : "Booking cancelled. No refund applies under the cancellation policy.",
    status: finalStatus,
    refundAmount: refund,
    tier,
  });
});
