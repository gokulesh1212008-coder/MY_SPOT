import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, StatusBadge, Badge } from "@/components/ui";
import { formatDateTime, formatMoney, formatTime } from "@/lib/format";
import QRCode from "@/components/QRCode";
import BookingDetailClient from "@/components/BookingDetailClient";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      space: { include: { images: true, owner: { select: { id: true, name: true } } } },
      vehicle: true,
      payments: { orderBy: { createdAt: "desc" } },
      review: true,
      incidents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!booking || booking.userId !== user.id) notFound();

  const qrValue = JSON.stringify({ ref: booking.bookingRef, token: booking.qrToken ?? "", space: booking.spaceId });

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard/bookings" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← All bookings
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold text-slate-900">{booking.space.title}</h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {booking.bookingRef} · {formatDateTime(booking.startAt)} → {formatDateTime(booking.endAt)}
          </p>
        </div>
        <p className="text-right">
          <span className="block font-display text-2xl font-extrabold text-slate-900">
            {formatMoney(booking.totalAmount, booking.space.currency)}
          </span>
          <span className="text-xs text-slate-400">paid at booking</span>
        </p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* QR + OTP */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-slate-900">Check-in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Show this QR or enter the OTP at the space. The owner authorizes your vehicle.
          </p>
          <div className="mt-4 flex justify-center">
            <QRCode value={qrValue} size={180} />
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Booking verification</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-800">{booking.bookingRef}</p>
            <p className="mt-1 text-xs text-slate-400">
              Vehicle: {booking.vehicle.model} · {booking.vehicle.regNumber}
            </p>
          </div>
          {!booking.ownerApproved && booking.status === "CONFIRMED" && (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
              ⏳ Waiting for the owner to approve your vehicle. You can check in once approved.
            </p>
          )}
        </Card>

        {/* Booking details */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Booking details</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Parking space</dt>
                <dd className="font-medium text-slate-900">{booking.space.title}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Vehicle</dt>
                <dd className="font-medium text-slate-900">
                  {booking.vehicle.model} · {booking.vehicle.regNumber} ({booking.vehicle.type})
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Start</dt>
                <dd className="font-medium text-slate-900">{formatDateTime(booking.startAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">End</dt>
                <dd className="font-medium text-slate-900">{formatDateTime(booking.endAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Owner approval</dt>
                <dd className="font-medium text-slate-900">{booking.ownerApproved ? "Approved" : "Pending"}</dd>
              </div>
              {booking.checkInAt && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Checked in</dt>
                  <dd className="font-medium text-emerald-600">{formatTime(booking.checkInAt)}</dd>
                </div>
              )}
              {booking.checkOutAt && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Checked out</dt>
                  <dd className="font-medium text-emerald-600">{formatTime(booking.checkOutAt)}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Payments</h2>
            <div className="mt-4 space-y-2">
              {booking.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                  <div>
                    <span className="font-medium text-slate-800">
                      {p.type === "BOOKING" ? "Booking" : p.type === "EXTENSION" ? "Extension / overtime" : "Refund"}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">{p.provider} · {p.providerRef ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {p.type === "REFUND" ? "−" : ""}
                      {formatMoney(p.amount, booking.space.currency)}
                    </span>
                    <Badge color={p.status === "SUCCESS" ? "green" : p.status === "FAILED" ? "red" : "amber"}>{p.status}</Badge>
                  </div>
                </div>
              ))}
              {booking.payments.length === 0 && <p className="text-sm text-slate-500">No payments recorded.</p>}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Owner earns {formatMoney(booking.ownerAmount, booking.space.currency)} · platform fee & commission{" "}
              {formatMoney(booking.commissionAmount + booking.feeAmount, booking.space.currency)}
            </p>
          </Card>
        </div>
      </div>

      <BookingDetailClient
        booking={{
          id: booking.id,
          status: booking.status,
          ownerApproved: booking.ownerApproved,
          startAt: booking.startAt.toISOString(),
          endAt: booking.endAt.toISOString(),
          totalAmount: booking.totalAmount,
          currency: booking.space.currency,
          pricePerHour: booking.space.pricePerHour,
          openHour: booking.space.openHour,
          closeHour: booking.space.closeHour,
          hasReview: !!booking.review,
          reviewRating: booking.review?.rating ?? null,
          reviewComment: booking.review?.comment ?? null,
          incidentCount: booking.incidents.length,
        }}
      />
    </div>
  );
}
