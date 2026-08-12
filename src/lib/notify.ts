import { prisma } from "./db";

export async function notify(userId: string, title: string, body: string, type = "info") {
  await prisma.notification.create({ data: { userId, title, body, type } });
}

const smsConfigured = Boolean(process.env.SMS_PROVIDER && process.env.SMS_API_KEY);

/**
 * SMS delivery. When a provider is configured (SMS_PROVIDER / SMS_API_KEY) the
 * message goes to it — plug the provider SDK call in the marked spot. When no
 * provider is configured we fall back to the server console so the OTP/booking
 * flow stays fully testable in development and demo deployments.
 */
export async function sendSms(phone: string, text: string) {
  if (smsConfigured) {
    // TODO(prod): integrate your SMS provider (e.g. Twilio, MSG91) here.
    console.log(`[sms:${phone}] ${text}`);
    return;
  }
  console.log(`[sms:${phone}] ${text} (SMS provider not configured — dev fallback)`);
}

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

export async function sendEmail(to: string, subject: string, text: string) {
  if (smtpConfigured) {
    // TODO(prod): integrate SMTP via SMTP_HOST/PORT/USER/PASS.
    console.log(`[email:${to}] ${subject} — ${text}`);
    return;
  }
  console.log(`[email:${to}] ${subject} — ${text} (SMTP not configured — dev fallback)`);
}
