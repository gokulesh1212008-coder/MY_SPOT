import { describe, it, expect } from "vitest";
import { generateOtp, hashOtp, verifyOtp, OTP_MAX_ATTEMPTS } from "./otp";

describe("OTP", () => {
  it("generates 6-digit codes", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });

  it("verifies correct OTP before expiry", () => {
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 600_000);
    expect(verifyOtp(otp, hashOtp(otp), expiresAt, 0)).toBe(true);
  });

  it("rejects wrong OTP", () => {
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 600_000);
    expect(verifyOtp("000000", hashOtp(otp), expiresAt, 0)).toBe(false);
  });

  it("rejects expired OTP", () => {
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() - 1000);
    expect(verifyOtp(otp, hashOtp(otp), expiresAt, 0)).toBe(false);
  });

  it("rejects after too many attempts", () => {
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 600_000);
    expect(verifyOtp(otp, hashOtp(otp), expiresAt, OTP_MAX_ATTEMPTS)).toBe(false);
  });
});
