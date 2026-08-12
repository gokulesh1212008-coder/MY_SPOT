import { NextRequest } from "next/server";
import { api, json, apiError, apiAdmin, ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import type { Prisma, IncidentStatus } from "@prisma/client";

export const PATCH = api(async (req: NextRequest, ctx) => {
  const admin = await apiAdmin();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) throw new ApiError("Incident not found.", 404);

  const data: Prisma.IncidentUpdateInput = {};
  if (body.status !== undefined) {
    const s = String(body.status);
    if (!["OPEN", "UNDER_REVIEW", "INVESTIGATING", "RESOLVED", "CLOSED"].includes(s)) return apiError("Invalid status.", 422);
    data.status = s as IncidentStatus;
  }
  if (body.resolution !== undefined) data.resolution = String(body.resolution).trim() || null;

  const updated = await prisma.incident.update({ where: { id }, data });
  await notify(incident.reportedById, "Incident update", `Your incident ${incident.ref} is now ${String(data.status ?? updated.status)}.`, "security");
  await logAudit({ userId: admin.id, action: "admin.incident_updated", targetType: "incident", targetId: id });
  return json({ incident: updated });
});
