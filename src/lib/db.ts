import { PrismaClient } from "@prisma/client";

/**
 * SQLite uses a single-writer lock. If another process (e.g. `prisma/seed.ts`)
 * holds the write lock for a moment, live requests can hit a transient
 * "database is locked" error (P2034 / P1008 / P1009). Retry those briefly
 * instead of failing the request — reads and single writes are idempotent at
 * this level, so the retry is safe.
 */
const LOCK_CODES = new Set(["P2034", "P1008", "P1009"]);

const createClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  }).$extends({
    query: {
      async $allOperations({ args, query }) {
        const MAX_ATTEMPTS = 3;
        let lastError: unknown;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          try {
            return await query(args);
          } catch (e) {
            const code = (e as { code?: string } | undefined)?.code;
            if (!code || !LOCK_CODES.has(code)) throw e;
            lastError = e;
            // Short backoff; the lock holder (e.g. a reseed) releases quickly.
            await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
          }
        }
        throw lastError;
      },
    },
  });

export type DbClient = ReturnType<typeof createClient>;

const globalForPrisma = globalThis as unknown as { prisma?: DbClient };

export const prisma: DbClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
