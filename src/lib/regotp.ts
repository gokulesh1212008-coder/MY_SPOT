import { prisma } from "./db";
import { generateOtp, hashOtp, OTP_MAX_ATTEMPTS, OTP_TTL_MINUTES, verifyOtp } from "./otp";

/**
 * DB-backed OTP challenge store for the registration flow. Using the database
 * (rather than an in-memory map) makes verification reliable across Next.js
 * dev workers, restarts and multiple server instances. One active challenge
 * per phone.
 */
export async function sendRegistrationOtp(phone: string): Promise<{ otp: string; ttlMinutes: number }> {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);
  await prisma.otpChallenge.upsert({
    where: { phone },
    update: { otpHash: hashOtp(otp), expiresAt, attempts: 0, verified: false },
    create: { phone, otpHash: hashOtp(otp), expiresAt },
  });
  return { otp, ttlMinutes: OTP_TTL_MINUTES };
}

export async function verifyRegistrationOtp(phone: string, code: string): Promise<{ ok: boolean; reason?: string }> {
  const ch = await prisma.otpChallenge.findUnique({ where: { phone } });
  if (!ch) return { ok: false, reason: "No OTP was sent to this number. Send a new code." };
  if (ch.verified) return { ok: true };
  if (verifyOtp(code, ch.otpHash, ch.expiresAt, ch.attempts)) {
    await prisma.otpChallenge.update({ where: { phone }, data: { verified: true } });
    return { ok: true };
  }
  const attempts = ch.attempts + 1;
  if (attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.otpChallenge.delete({ where: { phone } }).catch(() => {});
    return { ok: false, reason: "Too many incorrect attempts. Request a new code." };
  }
  await prisma.otpChallenge.update({ where: { phone }, data: { attempts } });
  return { ok: false, reason: `Incorrect code. ${OTP_MAX_ATTEMPTS - attempts} attempts left.` };
}

export async function isPhoneVerified(phone: string): Promise<boolean> {
  const ch = await prisma.otpChallenge.findUnique({ where: { phone } });
  return ch?.verified === true;
}

export async function clearRegistrationOtp(phone: string): Promise<void> {
  await prisma.otpChallenge.delete({ where: { phone } }).catch(() => {});
}
