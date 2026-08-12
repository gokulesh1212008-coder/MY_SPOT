import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, publicUser, type SessionUser } from "./auth";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

type Ctx = { params: Promise<Record<string, string>> };

export function api(handler: (req: NextRequest, ctx: Ctx) => Promise<Response>) {
  return async (req: NextRequest, ctx: Ctx): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) {
        return apiError(e.message, e.status);
      }
      console.error("[api error]", e);
      return apiError("Internal server error. Please try again.", 500);
    }
  };
}

export async function apiUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError("You must be signed in to do that.", 401);
  return user;
}

export async function apiOwner(): Promise<SessionUser> {
  const user = await apiUser();
  if (!user.isOwner && !user.isAdmin) throw new ApiError("Owner access required.", 403);
  return user;
}

export async function apiAdmin(): Promise<SessionUser> {
  const user = await apiUser();
  if (!user.isAdmin) throw new ApiError("Admin access required.", 403);
  return user;
}

export function safeUser(user: SessionUser) {
  return publicUser(user);
}
