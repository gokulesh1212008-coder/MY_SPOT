"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import { Button, Card, Badge } from "@/components/ui";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  createdAt: string;
  _count: { bookings: number; parkingSpaces: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(d.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function update(u: AdminUser, patch: Record<string, unknown>) {
    try {
      await apiFetch(`/api/admin/users/${u.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-slate-900">Users</h2>
      <p className="mt-1 text-sm text-slate-500">Manage drivers, owners and admins.</p>
      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          users.map((u) => (
            <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{u.name}</p>
                  {u.isAdmin && <Badge color="violet">Admin</Badge>}
                  {u.isOwner && <Badge color="green">Owner</Badge>}
                  {!u.isVerified && <Badge color="amber">Unverified</Badge>}
                </div>
                <p className="text-sm text-slate-500">{u.email}</p>
                <p className="text-xs text-slate-400">
                  {u._count.bookings} bookings · {u._count.parkingSpaces} spaces · joined {new Date(u.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={u.isOwner ? "secondary" : "outline"} onClick={() => update(u, { isOwner: !u.isOwner })}>
                  {u.isOwner ? "Remove owner" : "Make owner"}
                </Button>
                <Button size="sm" variant={u.isAdmin ? "secondary" : "outline"} onClick={() => update(u, { isAdmin: !u.isAdmin })}>
                  {u.isAdmin ? "Remove admin" : "Make admin"}
                </Button>
                <Button size="sm" variant={u.isVerified ? "secondary" : "outline"} onClick={() => update(u, { isVerified: !u.isVerified })}>
                  {u.isVerified ? "Unverify" : "Verify"}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
