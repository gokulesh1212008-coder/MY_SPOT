import { NextRequest } from "next/server";
import { api, json, apiError, apiUser, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

export const POST = api(async (req: NextRequest, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const approve = body.approve !== false;

  const booking = await prisma.booking.findUnique({ where: { id }, include: { space: true } });
  if (!booking) throw new ApiError("Booking not found.", 404);
  if (booking.space.ownerId !== user.id && !user.isAdmin) {
    throw new ApiError("Only the owner of this parking space can approve bookings.", 403);
  }
  if (booking.status !== "CONFIRMED") {
    return apiError("Only confirmed bookings can be approved.", 422);
  }

  if (approve) {
    await prisma.booking.update({ where: { id }, data: { ownerApproved: true } });
    await notify(booking.userId, "Booking approved ✅", `The owner approved your booking at ${booking.space.title}. You can now check in with your OTP.`, "booking");
    await logAudit({ userId: user.id, action: "booking.approved", targetType: "booking", targetId: id });
    return json({ message: "Booking approved. The driver can now check in.", ownerApproved: true });
  }

  await prisma.booking.update({ where: { id }, data: { status: "CANCELLED", cancelReason: "rejected_by_owner", cancelledAt: new Date() } });
  await notify(booking.userId, "Booking rejected", `The owner could not accept your booking at ${booking.space.title}.`, "booking");
  await logAudit({ userId: user.id, action: "booking.rejected", targetType: "booking", targetId: id });
  return json({ message: "Booking rejected and cancelled. The driver has been notified.", ownerApproved: false });
});
