import { prisma } from "./db";

export async function logAudit(opts: {
  userId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  result?: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId: opts.userId ?? null,
      action: opts.action,
      targetType: opts.targetType ?? null,
      targetId: opts.targetId ?? null,
      result: opts.result ?? null,
    },
  });
}
