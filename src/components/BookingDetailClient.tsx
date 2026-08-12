"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/http";
import { Button, Card, Input, Textarea, Select } from "./ui";
import { StarRating } from "./StarRating";

interface Props {
  booking: {
    id: string;
    status: string;
    ownerApproved: boolean;
    startAt: string;
    endAt: string;
    totalAmount: number;
    currency: string;
    pricePerHour: number;
    openHour: number;
    closeHour: number;
    hasReview: boolean;
    reviewRating: number | null;
    reviewComment: string | null;
    incidentCount: number;
  };
}

export default function BookingDetailClient({ booking }: Props) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState("");
  const [extendTo, setExtendTo] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [incidentType, setIncidentType] = useState("unauthorized_vehicle");
  const [incidentDesc, setIncidentDesc] = useState("");

  const now = new Date();
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const isCheckedIn = booking.status === "CHECKED_IN";
  const canCheckIn = booking.status === "CONFIRMED" && booking.ownerApproved;
  const canCheckOut = isCheckedIn;
  const canExtend = ["CONFIRMED", "CHECKED_IN"].includes(booking.status) && now < end;
  const canCancel = ["PENDING", "PAYMENT_PENDING", "CONFIRMED"].includes(booking.status) && now < start;
  const canReview = booking.status === "COMPLETED" && !booking.hasReview;

  function flash(type: "ok" | "err", text: string) {
    setMessage({ type, text });
  }

  async function action(name: string, fn: () => Promise<unknown>) {
    setBusy(name);
    setMessage(null);
    try {
      await fn();
      flash("ok", "Done ✓");
      router.refresh();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy("");
    }
  }

  async function checkIn() {
    await action("checkin", () =>
      apiFetch(`/api/bookings/${booking.id}/checkin`, { method: "POST", body: JSON.stringify({ otp }) })
    );
    setOtp("");
  }

  async function checkOut() {
    await action("checkout", () => apiFetch(`/api/bookings/${booking.id}/checkout`, { method: "POST" }));
  }

  async function extend() {
    if (!extendTo) return flash("err", "Choose a new end time first.");
    await action("extend", () =>
      apiFetch(`/api/bookings/${booking.id}/extend`, { method: "POST", body: JSON.stringify({ newEndAt: new Date(extendTo).toISOString() }) })
    );
    setExtendTo("");
  }

  async function cancel() {
    const reason = window.prompt("Reason for cancelling? (optional)", "");
    await action("cancel", () =>
      apiFetch(`/api/bookings/${booking.id}`, { method: "PATCH", body: JSON.stringify({ action: "cancel", reason: reason ?? "" }) })
    );
  }

  async function submitReview() {
    if (rating === 0) return flash("err", "Select a star rating.");
    await action("review", () =>
      apiFetch(`/api/bookings/${booking.id}/review`, { method: "POST", body: JSON.stringify({ rating, comment }) })
    );
  }

  async function reportIncident() {
    if (incidentDesc.length < 10) return flash("err", "Describe the incident (min 10 characters).");
    await action("incident", () =>
      apiFetch("/api/incidents", { method: "POST", body: JSON.stringify({ bookingId: booking.id, type: incidentType, description: incidentDesc }) })
    );
    setIncidentDesc("");
  }

  return (
    <div className="mt-6 space-y-6">
      {message && (
        <p className={`rounded-xl px-4 py-3 text-sm font-medium ${message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
          {message.text}
        </p>
      )}

      {/* Actions grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {canCheckIn && (
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold text-slate-900">🔐 Check in with OTP</h3>
            <p className="mt-1 text-sm text-slate-500">Enter the OTP delivered for this booking to verify your vehicle.</p>
            <div className="mt-4 flex gap-2">
              <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} maxLength={6} placeholder="6-digit OTP" className="font-mono text-center text-lg tracking-widest" inputMode="numeric" />
              <Button onClick={checkIn} loading={busy === "checkin"}>Check in</Button>
            </div>
          </Card>
        )}

        {canExtend && (
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold text-slate-900">⏱️ Extend booking</h3>
            <p className="mt-1 text-sm text-slate-500">Need more time? Extend if the next slot is free.</p>
            <div className="mt-4 flex gap-2">
              <Input type="datetime-local" value={extendTo} min={booking.endAt} onChange={(e) => setExtendTo(e.target.value)} className="flex-1" />
              <Button onClick={extend} loading={busy === "extend"} variant="outline">Extend</Button>
            </div>
          </Card>
        )}

        {(canCheckIn || isCheckedIn) && (
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold text-slate-900">🚗 Vehicle status</h3>
            <p className="mt-1 text-sm text-slate-500">
              {isCheckedIn ? "You are checked in. Check out when you leave." : "Check in when you arrive at the space."}
            </p>
            {canCheckOut && (
              <Button onClick={checkOut} loading={busy === "checkout"} variant="success" className="mt-4 w-full" size="lg">
                Check out & complete booking
              </Button>
            )}
          </Card>
        )}

        {canCancel && (
          <Card className="p-6 border-rose-200">
            <h3 className="font-display text-lg font-bold text-slate-900">Cancel booking</h3>
            <p className="mt-1 text-sm text-slate-500">
              Refund policy: full refund ≥ 24h before start, 50% between 24h and 2h, none within 2h.
            </p>
            <Button onClick={cancel} loading={busy === "cancel"} variant="danger" className="mt-4 w-full">
              Cancel booking
            </Button>
          </Card>
        )}

        {canReview && (
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold text-slate-900">⭐ Review this parking</h3>
            <p className="mt-1 text-sm text-slate-500">Share your experience to help other drivers.</p>
            <div className="mt-3">
              <StarRating value={rating} onChange={setRating} />
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the space, safety, access?" className="mt-3" maxLength={500} rows={3} />
            <Button onClick={submitReview} loading={busy === "review"} className="mt-3 w-full">
              Submit review
            </Button>
          </Card>
        )}
      </div>

      {/* Incident report */}
      <Card className="p-6">
        <h3 className="font-display text-lg font-bold text-slate-900">🛡️ Report an incident</h3>
        <p className="mt-1 text-sm text-slate-500">
          Unauthorized vehicle, damage, safety concern, or payment issue — our team investigates with a full audit trail.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Select value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
            <option value="unauthorized_vehicle">Unauthorized vehicle</option>
            <option value="parking_dispute">Parking dispute</option>
            <option value="damage">Damage</option>
            <option value="safety_concern">Safety concern</option>
            <option value="access_problem">Access problem</option>
            <option value="payment_issue">Payment issue</option>
            <option value="booking_issue">Booking issue</option>
            <option value="misuse">Misuse of parking</option>
            <option value="other">Other</option>
          </Select>
          <Input value={incidentDesc} onChange={(e) => setIncidentDesc(e.target.value)} placeholder="Describe what happened…" />
        </div>
        <Button onClick={reportIncident} loading={busy === "incident"} variant="outline" className="mt-3">
          Submit incident report
        </Button>
        {booking.incidentCount > 0 && (
          <p className="mt-2 text-xs text-slate-400">{booking.incidentCount} incident(s) filed for this booking. Track them in Incidents.</p>
        )}
      </Card>
    </div>
  );
}
