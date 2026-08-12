"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import { Button, Card, EmptyState, Badge } from "@/components/ui";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const typeIcon: Record<string, string> = {
  booking: "📅",
  reminder: "⏰",
  security: "🔐",
  review: "⭐",
  listing: "🏠",
  finance: "💰",
  info: "🔔",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<{ notifications: NotificationItem[] }>("/api/notifications");
      setItems(d.notifications);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    await apiFetch(`/api/notifications/${id}`, { method: "PATCH" });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-slate-900">Notifications</h1>
      <p className="mt-1 text-sm text-slate-500">Booking updates, reminders, and security alerts.</p>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState title="No notifications" body="Booking confirmations, reminders and alerts will appear here." />
        ) : (
          items.map((n) => (
            <Card key={n.id} className={`p-4 transition ${n.read ? "opacity-60" : "border-brand-200 bg-brand-50/40"}`}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xl">{typeIcon[n.type] ?? "🔔"}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    {!n.read && <Badge color="blue">New</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {!n.read && (
                  <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
