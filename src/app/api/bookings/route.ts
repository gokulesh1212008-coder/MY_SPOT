import { NextRequest } from "next/server";
import { api, json, apiError, apiUser, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { computePrice } from "@/lib/pricing";
import { BLOCKING_STATUSES, isValidRange, withinOperatingHours, withinMaxDuration, bookingRef } from "@/lib/booking";
import { generateOtp, hashOtp, OTP_TTL_MINUTES, generateQrToken } from "@/lib/otp";
import { getPaymentProvider } from "@/lib/payments/provider";
import type { BookingStatus } from "@prisma/client";
import { notify, sendSms } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

export const GET = api(async (req: NextRequest) => {
  const user = await apiUser();
  const role = req.nextUrl.searchParams.get("role");
  const where =
    role === "owner"
      ? { space: { ownerId: user.id } }
      : role === "all"
        ? user.isAdmin
          ? {}
          : { OR: [{ userId: user.id }, { space: { ownerId: user.id } }] }
        : { userId: user.id };

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      space: { include: { images: true } },
      vehicle: true,
      payments: { orderBy: { createdAt: "desc" } },
      review: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return json({ bookings });
});

export const POST = api(async (req: NextRequest) => {
  const user = await apiUser();
  const body = await req.json().catch(() => ({}));
  const spaceId = String(body.spaceId ?? "");
  const vehicleId = String(body.vehicleId ?? "");
  const startAt = new Date(body.startAt as string);
  const endAt = new Date(body.endAt as string);

  if (!spaceId || !vehicleId || isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
    return apiError("Select a parking space, a vehicle, and a valid time range.", 422);
  }
  if (!isValidRange(startAt, endAt)) return apiError("End time must be after start time.", 422);
  if (startAt.getTime() < Date.now() - 5 * 60 * 1000) return apiError("Booking start time is in the past.", 422);

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.userId !== user.id) throw new ApiError("Vehicle not found.", 404);
  if (!vehicle.isActive) return apiError("This vehicle is inactive. Activate it before booking.", 422);

  const space = await prisma.parkingSpace.findUnique({ where: { id: spaceId } });
  if (!space || space.status !== "ACTIVE") throw new ApiError("This parking space is not available.", 404);

  let allowedTypes: string[] = ["CAR"];
  try {
    allowedTypes = JSON.parse(space.allowedTypes);
  } catch {
    /* ignore */
  }
  if (!allowedTypes.includes(vehicle.type)) {
    return apiError(`This space does not accept ${vehicle.type.toLowerCase()} vehicles. Choose a compatible space.`, 422);
  }

  const settings = await getSettings();
  if (!withinOperatingHours(startAt, endAt, space.openHour, space.closeHour)) {
    return apiError(`This space is open ${space.openHour}:00–${space.closeHour}:00. Pick a time inside those hours.`, 422);
  }
  if (!withinMaxDuration(startAt, endAt, settings.maxBookingHours)) {
    return apiError(`Bookings can be at most ${settings.maxBookingHours} hours long.`, 422);
  }

  const price = computePrice(space.pricePerHour, startAt, endAt, {
    commissionRate: settings.commissionRate,
    feeRate: settings.feeRate,
    taxRate: settings.taxRate,
    convenienceFee: settings.convenienceFee,
    refundFullHours: settings.refundFullHours,
    refundHalfHours: settings.refundHalfHours,
  });

  const otp = generateOtp();

  const booking = await prisma.$transaction(async (tx) => {
    const conflicts = await tx.booking.findMany({
      where: {
        spaceId,
        status: { in: [...BLOCKING_STATUSES] as BookingStatus[] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });
    if (conflicts.length > 0) {
      throw new ApiError("Sorry, this time slot was just booked. Choose another time.", 409);
    }
    return tx.booking.create({
      data: {
        bookingRef: bookingRef(),
        userId: user.id,
        spaceId,
        vehicleId,
        startAt,
        endAt,
        status: "PAYMENT_PENDING",
        ownerApproved: space.autoApprove,
        baseAmount: price.baseAmount,
        feeAmount: price.feeAmount,
        taxAmount: price.taxAmount,
        discountAmount: price.discountAmount,
        totalAmount: price.totalAmount,
        ownerAmount: price.ownerAmount,
        commissionAmount: price.commissionAmount,
        qrToken: generateQrToken(),
        otpHash: hashOtp(otp),
        otpExpiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      },
    });
  });

  // Charge the payment provider (sandbox by default — real gateways via env config).
  const provider = getPaymentProvider();
  let paymentResult;
  try {
    paymentResult = await provider.charge({
      amount: price.totalAmount,
      currency: settings.currency,
      bookingRef: booking.bookingRef,
      description: `MYSPOT parking booking ${booking.bookingRef}`,
    });
  } catch (e) {
    paymentResult = { success: false, providerRef: "", message: e instanceof Error ? e.message : "Payment provider error." };
  }

  if (!paymentResult.success) {
    await prisma.$transaction([
      prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED", cancelReason: "payment_failed", cancelledAt: new Date() } }),
      prisma.payment.create({
        data: { bookingId: booking.id, provider: provider.name, type: "BOOKING", amount: price.totalAmount, status: "FAILED" },
      }),
    ]);
    await logAudit({ userId: user.id, action: "booking.payment_failed", targetType: "booking", targetId: booking.id });
    return apiError(paymentResult.message || "Payment could not be completed. Your booking has not been confirmed.", 402);
  }

  const confirmed = await prisma.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED" } });
  await prisma.payment.create({
    data: { bookingId: booking.id, provider: provider.name, providerRef: paymentResult.providerRef, type: "BOOKING", amount: price.totalAmount, status: "SUCCESS" },
  });

  await notify(user.id, "Booking confirmed 🎉", `Your parking at ${space.title} is confirmed (${booking.bookingRef}). Use the OTP at check-in.`);
  await notify(space.ownerId, "New parking booking", `${user.name} booked ${space.title} (${booking.bookingRef}).`, "booking");
  if (!space.autoApprove) {
    await notify(space.ownerId, "Approval required", `Approve or reject the booking for ${space.title}.`, "booking");
  }
  await sendSms(user.phone ?? "—", `MYSPOT OTP for ${booking.bookingRef}: ${otp} (valid 15 min).`);
  await logAudit({ userId: user.id, action: "booking.created", targetType: "booking", targetId: booking.id, result: "confirmed" });

  return json(
    {
      booking: {
        ...confirmed,
        // Dev convenience: in production the OTP goes out via SMS only.
        otp: process.env.NODE_ENV !== "production" ? otp : undefined,
      },
      message: "Booking confirmed!",
    },
    201
  );
});
