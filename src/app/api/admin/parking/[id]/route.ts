import { NextRequest } from "next/server";
import { api, json, apiError, apiAdmin, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import type { Prisma, VerificationStatus, ListingStatus } from "@prisma/client";

export const PATCH = api(async (req: NextRequest, ctx) => {
  const admin = await apiAdmin();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const space = await prisma.parkingSpace.findUnique({ where: { id } });
  if (!space) throw new ApiError("Parking space not found.", 404);

  const data: Prisma.ParkingSpaceUpdateInput = {};
  if (body.verificationStatus !== undefined) {
    const v = String(body.verificationStatus);
    if (!["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"].includes(v)) return apiError("Invalid verification status.", 422);
    data.verificationStatus = v as VerificationStatus;
    if (v === "VERIFIED") {
      await notify(space.ownerId, "Parking verified ✅", `Your listing "${space.title}" is now verified by MYSPOT.`, "listing");
    } else if (v === "REJECTED" || v === "SUSPENDED") {
      await notify(space.ownerId, "Parking listing update", `Your listing "${space.title}" was marked ${v.toLowerCase()}.`, "listing");
    }
  }
  if (body.status !== undefined) {
    const s = String(body.status);
    if (!["ACTIVE", "INACTIVE"].includes(s)) return apiError("Invalid listing status.", 422);
    data.status = s as ListingStatus;
  }

  const updated = await prisma.parkingSpace.update({ where: { id }, data });
  await logAudit({ userId: admin.id, action: "admin.parking_updated", targetType: "parking", targetId: id, result: JSON.stringify(data) });
  return json({ space: updated });
});
