import { NextRequest } from "next/server";
import { api, json, apiError, apiUser } from "@/lib/api";
import { hashPassword, createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { isPhoneVerified, clearRegistrationOtp } from "@/lib/regotp";
import { VehicleType } from "@prisma/client";

const TYPES = ["BIKE", "CAR", "SUV", "TRUCK"];

export const POST = api(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim().replace(/[\s()-]/g, "");
  const aadhar = String(body.aadhar ?? "").trim();
  const password = String(body.password ?? "");
  const vehicle = body.vehicle && typeof body.vehicle === "object" ? body.vehicle : null;

  if (!name || name.length < 2) return apiError("Please enter your full name.", 422);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return apiError("Please enter a valid email address.", 422);
  if (!/^\+?[1-9]\d{9,14}$/.test(phone)) return apiError("Enter a valid phone number.", 422);
  if (!/^\d{12}$/.test(aadhar)) return apiError("Enter a valid 12-digit Aadhaar number.", 422);
  if (password.length < 8) return apiError("Password must be at least 8 characters.", 422);

  // Registration is gated on a verified phone OTP (step 1 of onboarding).
  if (!(await isPhoneVerified(phone))) {
    return apiError("Verify your phone number with the OTP before continuing.", 403);
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return apiError("An account with this email already exists. Try signing in.", 409);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      aadhar,
      phoneVerified: true,
      passwordHash: await hashPassword(password),
    },
  });

  if (vehicle) {
    const regNumber = String(vehicle.regNumber ?? "").trim().toUpperCase();
    const type = String(vehicle.type ?? "");
    const model = String(vehicle.model ?? "").trim();
    const color = String(vehicle.color ?? "").trim();
    const licenseNumber = vehicle.licenseNumber ? String(vehicle.licenseNumber).trim().toUpperCase() : null;
    const insuranceNumber = vehicle.insuranceNumber ? String(vehicle.insuranceNumber).trim().toUpperCase() : null;

    if (!/^[A-Z0-9 -]{4,15}$/.test(regNumber)) {
      return apiError("Enter a valid vehicle registration number (e.g., MH01AB1234).", 422);
    }
    if (!TYPES.includes(type)) return apiError("Select a valid vehicle type.", 422);
    if (!model) return apiError("Vehicle model is required.", 422);
    if (!color) return apiError("Vehicle colour is required.", 422);

    await prisma.vehicle.create({
      data: {
        userId: user.id,
        regNumber,
        type: type as VehicleType,
        model,
        color,
        licenseNumber,
        licenseVerified: Boolean(licenseNumber),
        insuranceNumber,
      },
    });
  }

  await clearRegistrationOtp(phone);
  await createSession(user.id);
  await logAudit({ userId: user.id, action: "register", result: "success" });
  await notify(user.id, "Welcome to MYSPOT 👋", "Your identity is verified. Find a parking spot near you.");

  return json(
    {
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, isOwner: false, isAdmin: false, phoneVerified: true },
    },
    201
  );
});

export const GET = api(async () => {
  const user = await apiUser();
  return json({ authenticated: true, user });
});
