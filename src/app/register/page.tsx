"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card } from "@/components/ui";
import { apiFetch } from "@/lib/http";
import { cn } from "@/lib/cn";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Record<string, string>;

function makeCaptcha() {
  const a = 3 + Math.floor(Math.random() * 7);
  const b = 1 + Math.floor(Math.random() * 9);
  const op = Math.random() > 0.5 ? "+" : "×";
  return { text: `${a} ${op} ${b}`, answer: String(op === "+" ? a + b : a * b) };
}

const VEHICLE_TYPES = ["BIKE", "CAR", "SUV", "TRUCK"] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 — identity
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");

  // Step 2 — vehicle
  const [regNumber, setRegNumber] = useState("");
  const [vType, setVType] = useState<string>("CAR");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [captcha, setCaptcha] = useState(makeCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const steps = useMemo(() => ["Identity & Verify", "Vehicle", "Done"], []);
  const cleanPhone = phone.trim().replace(/[\s()-]/g, "");
  const validIdentity = name.trim().length >= 2 && EMAIL_RE.test(email.trim()) && /^\+?[1-9]\d{9,14}$/.test(cleanPhone) && /^\d{12}$/.test(aadhar.trim()) && password.length >= 8;

  const canSendOtp = validIdentity && !otpSent;
  const canVerifyOtp = otpSent && !otpVerified && /^\d{6}$/.test(otp.trim());

  async function sendOtp() {
    setOtpError("");
    setOtpMessage("");
    setOtpSending(true);
    try {
      const d = await apiFetch<{ ttlMinutes: number; demoOtp?: string }>("/api/auth/register-otp", {
        method: "POST",
        body: JSON.stringify({ phone: cleanPhone }),
      });
      setOtpSent(true);
      if (d.demoOtp) {
        // No SMS provider configured → show the code so the flow is usable.
        setOtp(d.demoOtp);
        setOtpMessage(
          `Demo mode — your verification code is ${d.demoOtp}. It expires in ${d.ttlMinutes} min. (No SMS provider configured, so it's shown here instead of being texted.)`
        );
      } else {
        setOtpMessage(`Code sent to ${phone.trim()} — expires in ${d.ttlMinutes} min.`);
      }
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Could not send the code.");
    } finally {
      setOtpSending(false);
    }
  }

  async function verifyOtp() {
    setOtpError("");
    setOtpVerifying(true);
    try {
      await apiFetch("/api/auth/register-otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone: cleanPhone, code: otp.trim() }),
      });
      setOtpVerified(true);
      setOtpMessage("Phone number verified ✓");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setOtpVerifying(false);
    }
  }

  function validateVehicle(): boolean {
    const errors: FieldErrors = {};
    if (!/^[A-Z0-9 -]{4,15}$/.test(regNumber.trim().toUpperCase())) errors.regNumber = "Enter a valid plate, e.g. MH01AB1234.";
    if (!model.trim()) errors.model = "Vehicle model is required.";
    if (!color.trim()) errors.color = "Vehicle colour is required.";
    if (licenseNumber.trim() && !/^[A-Z0-9 -]{5,20}$/.test(licenseNumber.trim().toUpperCase())) errors.licenseNumber = "License number looks invalid (letters/digits only).";
    if (insuranceNumber.trim() && !/^[A-Z0-9 -]{5,20}$/.test(insuranceNumber.trim().toUpperCase())) errors.insuranceNumber = "Insurance number looks invalid.";
    if (captchaInput.trim().toLowerCase() !== captcha.answer.toLowerCase()) errors.captcha = "Incorrect answer — please try again.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function finish(e: React.FormEvent) {
    e.preventDefault();
    if (!validateVehicle()) return;
    setError("");
    setBusy(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: cleanPhone,
          aadhar: aadhar.trim(),
          password,
          vehicle: {
            regNumber: regNumber.trim().toUpperCase(),
            type: vType,
            model: model.trim(),
            color: color.trim(),
            licenseNumber: licenseNumber.trim().toUpperCase() || undefined,
            insuranceNumber: insuranceNumber.trim().toUpperCase() || undefined,
          },
        }),
      });
      setStep(3);
      setTimeout(() => router.push("/map"), 1800);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setStep(1);
    } finally {
      setBusy(false);
    }
  }

  const refreshCaptcha = useCallback(() => setCaptcha(makeCaptcha()), []);
  useEffect(() => {
    if (captchaInput && captchaInput.trim().toLowerCase() !== captcha.answer.toLowerCase()) {
      setFieldErrors((f) => ({ ...f, captcha: "Incorrect answer — please try again." }));
    } else {
      setFieldErrors((f) => ({ ...f, captcha: "" }));
    }
  }, [captchaInput, captcha.answer]);

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-slate-950 px-4 py-16">
      <div className="absolute -left-24 top-0 size-96 rounded-full bg-brand-600/30 blur-[110px]" />
      <div className="absolute -right-24 bottom-0 size-96 rounded-full bg-cyan-500/25 blur-[110px]" />
      <Card className="relative w-full max-w-md p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-2xl text-white shadow-lg shadow-brand-600/30">🚗</span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-900">Create your MYSPOT account</h1>
          <p className="mt-1 text-sm text-slate-500">Verify your identity, add your vehicle, start parking.</p>
        </div>

        {/* Step indicator */}
        <ol className="mb-6 flex items-center gap-1" aria-label="Registration steps">
          {steps.map((label, i) => {
            const n = i + 1;
            const state = step > n || (step === 3 && i === 2) ? "done" : step === n ? "active" : "todo";
            return (
              <li key={label} className="flex flex-1 flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs font-bold transition",
                    state === "done" && "bg-emerald-500 text-white",
                    state === "active" && "bg-brand-600 text-white ring-4 ring-brand-100",
                    state === "todo" && "bg-slate-200 text-slate-500"
                  )}
                >
                  {state === "done" ? "✓" : n}
                </span>
                <span className={cn("text-[10px] font-medium", state === "active" ? "text-brand-700" : "text-slate-400")}>{label}</span>
              </li>
            );
          })}
        </ol>

        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (otpVerified) setStep(2);
            }}
            noValidate
            className="space-y-4"
          >
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Sharma" autoComplete="name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
              {fieldErrors.email && <p className="mt-1.5 text-sm font-medium text-rose-600">{fieldErrors.email}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 00000" autoComplete="tel" />
            </div>
            <div>
              <Label htmlFor="aadhar">Aadhaar number (12 digits)</Label>
              <Input id="aadhar" value={aadhar} onChange={(e) => setAadhar(e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="XXXX XXXX XXXX" inputMode="numeric" autoComplete="off" />
              <p className="mt-1 text-xs text-slate-400">Stored encrypted-side for KYC. You must verify with OTP to continue.</p>
            </div>
            <div>
              <Label htmlFor="password">Password (min 8 characters)</Label>
              <Input id="password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </div>

            {/* OTP row */}
            <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
              <p className="mb-2 text-sm font-semibold text-brand-900">
                {otpVerified ? "✅ Phone verified" : "Verify your phone with OTP"}
              </p>
              {!otpVerified && (
                <div className="flex gap-2">
                  <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit OTP" inputMode="numeric" aria-label="One-time password" className="min-w-0 flex-1" />
                  <Button type="button" variant={otpSent ? "outline" : "primary"} onClick={sendOtp} loading={otpSending} disabled={!canSendOtp && !otpSent} className="whitespace-nowrap">
                    {otpSent ? "Resend" : "Send OTP"}
                  </Button>
                </div>
              )}
              {otpSent && !otpVerified && (
                <Button type="button" onClick={verifyOtp} loading={otpVerifying} disabled={!canVerifyOtp} size="sm" className="mt-2 w-full">
                  Verify OTP
                </Button>
              )}
              {otpMessage && <p className="mt-2 text-xs font-medium text-emerald-700">{otpMessage}</p>}
              {otpError && <p className="mt-2 text-xs font-medium text-rose-600">{otpError}</p>}
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
                {error}
              </p>
            )}
            <Button type="submit" disabled={!otpVerified} className="w-full" size="lg">
              {otpVerified ? "Continue → Add vehicle" : "Verify phone to continue"}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={finish} noValidate className="space-y-4">
            <div>
              <Label htmlFor="regNumber">Vehicle number plate</Label>
              <Input id="regNumber" value={regNumber} onChange={(e) => setRegNumber(e.target.value.toUpperCase())} placeholder="MH01AB1234" autoComplete="off" aria-invalid={Boolean(fieldErrors.regNumber)} />
              {fieldErrors.regNumber && <p className="mt-1.5 text-sm font-medium text-rose-600">{fieldErrors.regNumber}</p>}
            </div>
            <div>
              <Label htmlFor="vType">Vehicle type</Label>
              <select
                id="vType"
                value={vType}
                onChange={(e) => setVType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="model">Model</Label>
                <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Honda City" autoComplete="off" aria-invalid={Boolean(fieldErrors.model)} />
                {fieldErrors.model && <p className="mt-1.5 text-sm font-medium text-rose-600">{fieldErrors.model}</p>}
              </div>
              <div>
                <Label htmlFor="color">Colour</Label>
                <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="White" autoComplete="off" aria-invalid={Boolean(fieldErrors.color)} />
                {fieldErrors.color && <p className="mt-1.5 text-sm font-medium text-rose-600">{fieldErrors.color}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="licenseNumber">Driving licence number (verification)</Label>
              <Input id="licenseNumber" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())} placeholder="MH0120220000000" autoComplete="off" aria-invalid={Boolean(fieldErrors.licenseNumber)} />
              {fieldErrors.licenseNumber && <p className="mt-1.5 text-sm font-medium text-rose-600">{fieldErrors.licenseNumber}</p>}
              <p className="mt-1 text-xs text-slate-400">Format-checked on registration; marks your vehicle licence-verified.</p>
            </div>
            <div>
              <Label htmlFor="insuranceNumber">Insurance policy number (optional)</Label>
              <Input id="insuranceNumber" value={insuranceNumber} onChange={(e) => setInsuranceNumber(e.target.value.toUpperCase())} placeholder="Optional — e.g. 1234567890" autoComplete="off" aria-invalid={Boolean(fieldErrors.insuranceNumber)} />
              {fieldErrors.insuranceNumber && <p className="mt-1.5 text-sm font-medium text-rose-600">{fieldErrors.insuranceNumber}</p>}
            </div>

            {/* CAPTCHA */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Label htmlFor="captcha">Are you human? Solve: {captcha.text}</Label>
              <div className="mt-2 flex gap-2">
                <Input id="captcha" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} placeholder="Answer" autoComplete="off" inputMode="numeric" aria-invalid={Boolean(fieldErrors.captcha)} className="min-w-0 flex-1" />
                <Button type="button" variant="outline" onClick={refreshCaptcha} aria-label="New captcha">
                  🔄
                </Button>
              </div>
              {fieldErrors.captcha && <p className="mt-1.5 text-sm font-medium text-rose-600">{fieldErrors.captcha}</p>}
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                ← Back
              </Button>
              <Button type="submit" loading={busy} className="flex-1" size="lg">
                Create account
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="py-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">🎉</div>
            <h2 className="mt-4 font-display text-2xl font-extrabold text-slate-900">You&apos;re all set!</h2>
            <p className="mt-2 text-sm text-slate-500">
              Identity verified, vehicle registered. Opening your live parking map…
            </p>
            <div className="mx-auto mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-full origin-left animate-[progress_1.8s_ease-in-out] rounded-full bg-emerald-500" style={{ animation: "progress 1.8s ease-in-out forwards" }} />
            </div>
          </div>
        )}

        {step !== 3 && (
          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>
        )}
      </Card>
    </div>
  );
}
