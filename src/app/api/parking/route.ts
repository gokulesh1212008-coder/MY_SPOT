import { NextRequest } from "next/server";
import { api, json, apiError, apiOwner } from "@/lib/api";
import { prisma } from "@/lib/db";
import { searchParking } from "@/lib/search";
import { SpaceType, ListingStatus } from "@prisma/client";

function num(v: string | null): number | undefined {
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

function bool(v: string | null): boolean | undefined {
  if (v === null || v === "") return undefined;
  return v === "true" || v === "1";
}

export const GET = api(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const results = await searchParking({
    lat: num(sp.get("lat")),
    lng: num(sp.get("lng")),
    radiusKm: num(sp.get("radius")),
    q: sp.get("q") ?? undefined,
    vehicleType: sp.get("vehicleType") ?? undefined,
    priceMax: num(sp.get("priceMax")),
    covered: bool(sp.get("covered")),
    cctv: bool(sp.get("cctv")),
    ev: bool(sp.get("ev")),
    indoor: bool(sp.get("indoor")),
    ratingMin: num(sp.get("ratingMin")),
    date: sp.get("date") ?? undefined,
    startTime: sp.get("startTime") ?? undefined,
    endTime: sp.get("endTime") ?? undefined,
    sort: (sp.get("sort") as never) ?? "recommended",
  });
  return json({ results });
});

const SPACE_TYPES = ["DRIVEWAY", "GARAGE", "LOT", "STREET"];

export const POST = api(async (req: NextRequest) => {
  const user = await apiOwner();
  const body = await req.json().catch(() => ({}));

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const lat = num(body.lat as string | null);
  const lng = num(body.lng as string | null);
  const address = String(body.address ?? "").trim();
  const spaceType = String(body.spaceType ?? "");
  const allowedTypes = Array.isArray(body.allowedTypes) ? body.allowedTypes.filter((t: unknown) => typeof t === "string") : [];
  const pricePerHour = num(body.pricePerHour as string | null);
  const openHour = num(body.openHour as string | null) ?? 0;
  const closeHour = num(body.closeHour as string | null) ?? 24;
  const images = Array.isArray(body.images) ? body.images.filter((i: unknown) => typeof i === "string" && i.startsWith("http")) : [];

  if (title.length < 4) return apiError("Give your parking space a clear title.", 422);
  if (description.length < 20) return apiError("Describe the space (at least 20 characters) so drivers know what they get.", 422);
  if (lat === undefined || lng === undefined) return apiError("Pin the exact location on the map.", 422);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return apiError("Invalid map coordinates.", 422);
  if (!address) return apiError("Address is required.", 422);
  if (!SPACE_TYPES.includes(spaceType)) return apiError("Select a parking type.", 422);
  if (allowedTypes.length === 0) return apiError("Select at least one compatible vehicle type.", 422);
  if (pricePerHour === undefined || pricePerHour <= 0) return apiError("Set a valid price per hour.", 422);
  if (openHour < 0 || openHour > 23 || closeHour < 1 || closeHour > 24 || closeHour <= openHour) {
    return apiError("Operating hours must be a valid window (e.g. 6 to 23).", 422);
  }

  const space = await prisma.parkingSpace.create({
    data: {
      ownerId: user.id,
      title,
      description,
      lat,
      lng,
      address,
      landmark: body.landmark ? String(body.landmark).trim() : null,
      spaceType: spaceType as SpaceType,
      allowedTypes: JSON.stringify(allowedTypes),
      maxDimensions: body.maxDimensions ? String(body.maxDimensions) : null,
      isCovered: Boolean(body.isCovered),
      isIndoor: Boolean(body.isIndoor),
      hasCCTV: Boolean(body.hasCCTV),
      hasLighting: body.hasLighting !== false,
      hasEV: Boolean(body.hasEV),
      pricePerHour,
      openHour,
      closeHour,
      autoApprove: body.autoApprove !== false,
      status: (body.status as ListingStatus) ?? "ACTIVE",
    },
  });

  for (let i = 0; i < images.length; i++) {
    await prisma.parkingImage.create({
      data: { spaceId: space.id, url: images[i], isPrimary: i === 0 },
    });
  }

  return json({ space }, 201);
});
