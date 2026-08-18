import { NextRequest } from "next/server";
import { api, json, apiError, apiUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { VehicleType } from "@prisma/client";

const TYPES = ["BIKE", "CAR", "SUV", "TRUCK"];

export const GET = api(async () => {
  const user = await apiUser();
  const vehicles = await prisma.vehicle.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return json({ vehicles });
});

export const POST = api(async (req: NextRequest) => {
  const user = await apiUser();
  const body = await req.json().catch(() => ({}));
  const regNumber = String(body.regNumber ?? "").trim().toUpperCase();
  const type = String(body.type ?? "");
  const model = String(body.model ?? "").trim();
  const color = String(body.color ?? "").trim();
  const nickname = body.nickname ? String(body.nickname).trim() : null;
  const licenseNumber = body.licenseNumber ? String(body.licenseNumber).trim().toUpperCase() : null;
  const insuranceNumber = body.insuranceNumber ? String(body.insuranceNumber).trim().toUpperCase() : null;

  if (!/^[A-Z0-9 -]{4,15}$/.test(regNumber)) {
    return apiError("Enter a valid registration number (e.g., MH01AB1234).", 422);
  }
  if (!TYPES.includes(type)) return apiError("Select a valid vehicle type.", 422);
  if (!model) return apiError("Vehicle model is required.", 422);
  if (!color) return apiError("Vehicle colour is required.", 422);

  const dup = await prisma.vehicle.findUnique({ where: { userId_regNumber: { userId: user.id, regNumber } } });
  if (dup) return apiError("You already added a vehicle with this registration number.", 409);

  const vehicle = await prisma.vehicle.create({
    data: {
      userId: user.id,
      regNumber,
      type: type as VehicleType,
      model,
      color,
      nickname,
      licenseNumber,
      licenseVerified: Boolean(licenseNumber),
      insuranceNumber,
    },
  });

  return json({ vehicle }, 201);
});
