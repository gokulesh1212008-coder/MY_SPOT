import { NextRequest } from "next/server";
import { api, json, apiError } from "@/lib/api";
import { sendRegistrationOtp } from "@/lib/regotp";
import { sendSms } from "@/lib/notify";

const PHONE_RE = /^\+?[1-9]\d{9,14}$/;

export const POST = api(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone ?? "").trim().replace(/[\s()-]/g, "");

  if (!PHONE_RE.test(phone)) {
    return apiError("Enter a valid phone number (e.g. +91 90000 00000).", 422);
  }

  const { otp, ttlMinutes } = await sendRegistrationOtp(phone);
  await sendSms(phone, `Your MYSPOT verification code is ${otp}. It expires in ${ttlMinutes} minutes.`);

  // When no SMS provider is configured the code cannot be delivered to the
  // phone, so return it to the client (demo mode) so the flow stays usable.
  // With a real provider (SMS_PROVIDER + SMS_API_KEY) it is never returned.
  const smsConfigured = Boolean(process.env.SMS_PROVIDER && process.env.SMS_API_KEY);

  return json({
    ok: true,
    ttlMinutes,
    masked: `${phone.slice(0, 4)}••••${phone.slice(-2)}`,
    ...(smsConfigured ? {} : { demoOtp: otp }),
  });
});
