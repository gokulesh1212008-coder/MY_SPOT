import { NextRequest } from "next/server";
import { api, json, apiError, apiOwner } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";

export const POST = api(async (req: NextRequest) => {
  const user = await apiOwner();
  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount);

  const completed = await prisma.booking.findMany({
    where: { space: { ownerId: user.id }, status: "COMPLETED" },
    select: { ownerAmount: true },
  });
  const paidOut = await prisma.payout.aggregate({ where: { ownerId: user.id, status: "PAID" }, _sum: { amount: true } });
  const pending = await prisma.payout.aggregate({ where: { ownerId: user.id, status: "PENDING" }, _sum: { amount: true } });

  const earned = completed.reduce((s, b) => s + b.ownerAmount, 0);
  const available = earned - (paidOut._sum.amount ?? 0) - (pending._sum.amount ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) return apiError("Enter a valid amount.", 422);
  if (amount > available + 0.01) return apiError(`You can request up to ${available.toFixed(0)} from your available balance.`, 422);

  const payout = await prisma.payout.create({ data: { ownerId: user.id, amount, note: body.note ? String(body.note) : null } });
  await notify(user.id, "Payout requested", `Your payout request of ₹${amount.toFixed(0)} is under review.`, "finance");
  return json({ payout, available }, 201);
});
