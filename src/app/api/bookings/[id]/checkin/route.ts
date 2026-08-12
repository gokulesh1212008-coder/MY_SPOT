import { NextRequest } from "next/server";
import { api, json, apiError, apiUser, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { verifyOtp, OTP_MAX_ATTEMPTS } from "@/lib/otp";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

export const POST = api(async (req: NextRequest, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const otp = String(body.otp ?? "").trim();

  const booking = await prisma.booking.findUnique({ where: { id }, include: { space: true } });
  if (!booking) throw new ApiError("Booking not found.", 404);
  if (booking.userId !== user.id && booking.space.ownerId !== user.id && !user.isAdmin) {
    throw new ApiError("You don't have access to this booking.", 403);
  }

  if (booking.status !== "CONFIRMED") {
    return apiError(`Check-in is only possible for confirmed bookings (current status: ${booking.status}).`, 422);
  }
  if (!booking.ownerApproved) {
    return apiError("The owner has not approved this booking yet.", 422);
  }
  if (!booking.otpHash || !booking.otpExpiresAt) {
    return apiError("No OTP was issued for this booking.", 422);
  }

  const now = new Date();
  const graceMs = 30 * 60 * 1000;
  if (now.getTime() < booking.startAt.getTime() - graceMs) {
    return apiError("Check-in opens 30 minutes before your booking start time.", 422);
  }
  if (now.getTime() > booking.endAt.getTime()) {
    await prisma.booking.update({ where: { id }, data: { status: "EXPIRED" } });
    return apiError("This booking has expired. Book a new slot if you still need parking.", 422);
  }

  if (!verifyOtp(otp, booking.otpHash, booking.otpExpiresAt, booking.otpAttempts)) {
    const attempts = booking.otpAttempts + 1;
    await prisma.booking.update({ where: { id }, data: { otpAttempts: attempts } });
    const left = OTP_MAX_ATTEMPTS - attempts;
    return apiError(
      left <= 0 ? "Too many failed attempts. Contact support for this booking." : `Incorrect OTP. ${left} attempt(s) left.`,
      401
    );
  }

  const checkedIn = await prisma.booking.update({ where: { id }, data: { status: "CHECKED_IN", checkInAt: now } });
  await notify(booking.space.ownerId, "Vehicle checked in", `Vehicle checked in for booking ${booking.bookingRef}.`, "security");
  await logAudit({ userId: user.id, action: "booking.checkin", targetType: "booking", targetId: id, result: "success" });

  return json({ message: "Check-in successful! Vehicle verified and authorized.", booking: checkedIn });
});
