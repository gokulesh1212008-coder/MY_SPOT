import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const SESSION_COOKIE = "myspot_session";
const SESSION_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await prisma.session.create({
    data: { tokenHash: sha256(token), userId, expiresAt },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export interface PublicUserShape {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isVerified: boolean;
}

export function publicUser(user: PublicUserShape) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isOwner: user.isOwner,
    isAdmin: user.isAdmin,
    isVerified: user.isVerified,
  };
}
