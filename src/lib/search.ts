import { prisma } from "./db";
import { haversineKm } from "./geo";
import { withinOperatingHours, BLOCKING_STATUSES } from "./booking";
import type { BookingStatus } from "@prisma/client";

export interface SearchParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  q?: string;
  vehicleType?: string;
  priceMax?: number;
  covered?: boolean;
  cctv?: boolean;
  ev?: boolean;
  indoor?: boolean;
  ratingMin?: number;
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  sort?: "recommended" | "distance" | "price_asc" | "price_desc" | "rating";
}

interface SpaceWithMeta {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  landmark: string | null;
  spaceType: string;
  allowedTypes: string;
  isCovered: boolean;
  isIndoor: boolean;
  hasCCTV: boolean;
  hasLighting: boolean;
  hasEV: boolean;
  pricePerHour: number;
  currency: string;
  openHour: number;
  closeHour: number;
  verificationStatus: string;
  rating: number;
  ratingCount: number;
  images: { url: string; isPrimary: boolean }[];
  owner: { id: string; name: string; isVerified: boolean };
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  landmark: string | null;
  spaceType: string;
  allowedTypes: string[];
  isCovered: boolean;
  isIndoor: boolean;
  hasCCTV: boolean;
  hasLighting: boolean;
  hasEV: boolean;
  pricePerHour: number;
  currency: string;
  openHour: number;
  closeHour: number;
  verificationStatus: string;
  rating: number;
  ratingCount: number;
  image: string;
  distanceKm: number | null;
  score: number;
  reasons: string[];
}

function parseAllowed(types: string): string[] {
  try {
    const v = JSON.parse(types);
    return Array.isArray(v) ? v : ["CAR"];
  } catch {
    return ["CAR"];
  }
}

export async function searchParking(params: SearchParams): Promise<SearchResult[]> {
  const { lat, lng, radiusKm, q, vehicleType, priceMax, covered, cctv, ev, indoor, ratingMin, sort } = params;

  // Build a requested window. Default: now → +2h (search always implies a window for availability).
  let start = new Date();
  let end = new Date(Date.now() + 2 * 3600 * 1000);
  if (params.date) {
    const [y, m, d] = params.date.split("-").map(Number);
    const st = params.startTime?.split(":").map(Number) ?? [start.getHours(), 0];
    const et = params.endTime?.split(":").map(Number) ?? [st[0] + 2, 0];
    start = new Date(y, m - 1, d, st[0], st[1] ?? 0);
    end = new Date(y, m - 1, d, et[0], et[1] ?? 0);
    if (!(end.getTime() > start.getTime())) end = new Date(start.getTime() + 2 * 3600 * 1000);
  }

  const spaces = (await prisma.parkingSpace.findMany({
    where: {
      status: "ACTIVE",
      ...(q ? { OR: [{ title: { contains: q } }, { address: { contains: q } }, { landmark: { contains: q } }] } : {}),
      ...(priceMax !== undefined ? { pricePerHour: { lte: priceMax } } : {}),
      ...(covered !== undefined ? { isCovered: covered } : {}),
      ...(cctv !== undefined ? { hasCCTV: cctv } : {}),
      ...(ev !== undefined ? { hasEV: ev } : {}),
      ...(indoor !== undefined ? { isIndoor: indoor } : {}),
    },
    include: { images: true, owner: { select: { id: true, name: true, isVerified: true } } },
    take: 200,
  })) as unknown as SpaceWithMeta[];

  // Prefetch blocking bookings in the window for all candidate spaces.
  const spaceIds = spaces.map((s) => s.id);
  const blockers = await prisma.booking.findMany({
    where: {
      spaceId: { in: spaceIds },
      status: { in: [...BLOCKING_STATUSES] as BookingStatus[] },
      startAt: { lt: end },
      endAt: { gt: start },
    },
    select: { spaceId: true },
  });
  const blocked = new Set(blockers.map((b) => b.spaceId));

  const results: SearchResult[] = [];

  for (const s of spaces) {
    if (blocked.has(s.id)) continue;
    if (!withinOperatingHours(start, end, s.openHour, s.closeHour)) continue;

    const allowed = parseAllowed(s.allowedTypes);
    if (vehicleType && vehicleType !== "ANY" && !allowed.includes(vehicleType)) continue;
    if (ratingMin !== undefined && s.rating < ratingMin) continue;

    const distanceKm = lat !== undefined && lng !== undefined ? haversineKm(lat, lng, s.lat, s.lng) : null;
    if (radiusKm !== undefined && distanceKm !== null && distanceKm > radiusKm) continue;

    const image = s.images.find((i) => i.isPrimary)?.url ?? s.images[0]?.url ?? "";

    const reasons: string[] = [];
    if (distanceKm !== null) {
      reasons.push(distanceKm < 1 ? `Under 1 km from your location` : `${distanceKm.toFixed(1)} km from your location`);
    }
    if (s.verificationStatus === "VERIFIED") reasons.push("Verified parking by MYSPOT");
    if (s.hasCCTV && s.isCovered) reasons.push("CCTV + covered");
    if (s.rating >= 4.5 && s.ratingCount >= 10) reasons.push(`Highly rated (${s.rating.toFixed(1)}★)`);
    if (s.hasEV) reasons.push("EV charging available");
    if (allowed.includes(vehicleType ?? "")) reasons.push("Fits your vehicle");
    if (reasons.length === 0) reasons.push("Available for your selected time");

    // Recommendation score: distance 35%, price 25%, rating 20%, security 20%.
    const maxPrice = Math.max(...spaces.map((x) => x.pricePerHour), 1);
    const normPrice = s.pricePerHour / maxPrice;
    const normDist = distanceKm !== null ? Math.min(distanceKm / 10, 1) : 0.5;
    const normRating = s.rating / 5;
    const security = (s.hasCCTV ? 0.5 : 0) + (s.isCovered ? 0.3 : 0) + (s.hasLighting ? 0.2 : 0);
    const score = 0.35 * (1 - normDist) + 0.25 * (1 - normPrice) + 0.2 * normRating + 0.2 * security;

    results.push({
      id: s.id,
      title: s.title,
      description: s.description,
      lat: s.lat,
      lng: s.lng,
      address: s.address,
      landmark: s.landmark,
      spaceType: s.spaceType,
      allowedTypes: allowed,
      isCovered: s.isCovered,
      isIndoor: s.isIndoor,
      hasCCTV: s.hasCCTV,
      hasLighting: s.hasLighting,
      hasEV: s.hasEV,
      pricePerHour: s.pricePerHour,
      currency: s.currency,
      openHour: s.openHour,
      closeHour: s.closeHour,
      verificationStatus: s.verificationStatus,
      rating: s.rating,
      ratingCount: s.ratingCount,
      image,
      distanceKm,
      score,
      reasons,
    });
  }

  results.sort((a, b) => {
    switch (sort) {
      case "distance":
        return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      case "price_asc":
        return a.pricePerHour - b.pricePerHour;
      case "price_desc":
        return b.pricePerHour - a.pricePerHour;
      case "rating":
        return b.rating - a.rating;
      default:
        return b.score - a.score;
    }
  });

  return results;
}
