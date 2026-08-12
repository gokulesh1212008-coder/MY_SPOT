import { NextRequest } from "next/server";
import { api, json, apiUser, ApiError } from "@/lib/api";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { BLOCKING_STATUSES, withinOperatingHours } from "@/lib/booking";
import type { Prisma, BookingStatus } from "@prisma/client";

export const GET = api(async (req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  const space = await prisma.parkingSpace.findUnique({
    where: { id },
    include: {
      images: { orderBy: { isPrimary: "desc" } },
      owner: { select: { id: true, name: true, isVerified: true } },
      reviews: {
        where: { moderated: false },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!space || space.status !== "ACTIVE") throw new ApiError("Parking space not found.", 404);

  let allowedTypes: string[] = ["CAR"];
  try {
    allowedTypes = JSON.parse(space.allowedTypes);
  } catch {
    /* ignore */
  }

  // Availability for an optional requested window.
  let available = true;
  let reason = "";
  const sp = req.nextUrl.searchParams;
  if (sp.get("date") && sp.get("startTime") && sp.get("endTime")) {
    const [y, m, d] = (sp.get("date") ?? "").split("-").map(Number);
    const [sh, sm] = (sp.get("startTime") ?? "0:0").split(":").map(Number);
    const [eh, em] = (sp.get("endTime") ?? "0:0").split(":").map(Number);
    const start = new Date(y, m - 1, d, sh, sm);
    const end = new Date(y, m - 1, d, eh, em);
    if (!withinOperatingHours(start, end, space.openHour, space.closeHour)) {
      available = false;
      reason = `Outside operating hours (${space.openHour}:00–${space.closeHour}:00).`;
    } else {
      const conflicts = await prisma.booking.findMany({
        where: {
          spaceId: space.id,
          status: { in: [...BLOCKING_STATUSES] as BookingStatus[] },
          startAt: { lt: end },
          endAt: { gt: start },
        },
        select: { id: true },
      });
      if (conflicts.length > 0) {
        available = false;
        reason = "Already booked for this time. Try another slot.";
      }
    }
  }

  const user = await getCurrentUser();
  let favorited = false;
  if (user) {
    const fav = await prisma.favorite.findUnique({
      where: { userId_spaceId: { userId: user.id, spaceId: id } },
    });
    favorited = !!fav;
  }

  return json({
    space: {
      ...space,
      allowedTypes,
      available,
      availabilityReason: reason,
      favorited,
      reviews: space.reviews,
      owner: space.owner,
    },
  });
});

export const PATCH = api(async (req: NextRequest, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;
  const space = await prisma.parkingSpace.findUnique({ where: { id } });
  if (!space) throw new ApiError("Parking space not found.", 404);
  if (space.ownerId !== user.id && !user.isAdmin) throw new ApiError("You can only edit your own listings.", 403);

  const body = await req.json().catch(() => ({}));
  const data: Prisma.ParkingSpaceUpdateInput = {};
  if (body.title !== undefined) data.title = String(body.title);
  if (body.description !== undefined) data.description = String(body.description);
  if (body.address !== undefined) data.address = String(body.address);
  if (body.landmark !== undefined) data.landmark = body.landmark ? String(body.landmark) : null;
  if (body.maxDimensions !== undefined) data.maxDimensions = body.maxDimensions ? String(body.maxDimensions) : null;
  if (body.spaceType !== undefined) data.spaceType = body.spaceType;
  if (body.isCovered !== undefined) data.isCovered = Boolean(body.isCovered);
  if (body.isIndoor !== undefined) data.isIndoor = Boolean(body.isIndoor);
  if (body.hasCCTV !== undefined) data.hasCCTV = Boolean(body.hasCCTV);
  if (body.hasLighting !== undefined) data.hasLighting = Boolean(body.hasLighting);
  if (body.hasEV !== undefined) data.hasEV = Boolean(body.hasEV);
  if (body.pricePerHour !== undefined) data.pricePerHour = Number(body.pricePerHour);
  if (body.openHour !== undefined) data.openHour = Number(body.openHour);
  if (body.closeHour !== undefined) data.closeHour = Number(body.closeHour);
  if (body.autoApprove !== undefined) data.autoApprove = Boolean(body.autoApprove);
  if (body.status !== undefined) data.status = body.status as Prisma.EnumListingStatusFieldUpdateOperationsInput | "ACTIVE" | "INACTIVE";
  if (Array.isArray(body.allowedTypes)) data.allowedTypes = JSON.stringify(body.allowedTypes);

  const updated = await prisma.parkingSpace.update({ where: { id }, data });
  return json({ space: updated });
});
