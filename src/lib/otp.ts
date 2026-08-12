import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_TTL_MINUTES = 15;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

export function hashOtp(otp: string): string {
  return createHash("sha256").update(`myspot-otp:${otp}`).digest("hex");
}

export function verifyOtp(input: string, storedHash: string, expiresAt: Date, attempts: number): boolean {
  if (attempts >= OTP_MAX_ATTEMPTS) return false;
  if (new Date() > expiresAt) return false;
  const inputHash = hashOtp(input.trim());
  const a = Buffer.from(inputHash, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const MAX_SAFE_RANDOM = 2 ** 48 - 1; // crypto.randomInt max is 2^48 - 1

export function generateQrToken(): string {
  return randomInt(0, MAX_SAFE_RANDOM).toString(36).toUpperCase() + randomInt(0, MAX_SAFE_RANDOM).toString(36).toUpperCase();
}
