"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ClientUser } from "@/lib/types";

const driverLinks = [
  { href: "/dashboard", label: "Overview", icon: "🏠" },
  { href: "/dashboard/bookings", label: "My bookings", icon: "📅" },
  { href: "/dashboard/vehicles", label: "Vehicles", icon: "🚗" },
  { href: "/dashboard/favorites", label: "Favorites", icon: "⭐" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "🔔" },
  { href: "/dashboard/incidents", label: "Incidents", icon: "🛡️" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function DashboardNav({ user }: { user: ClientUser }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href));

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
        <nav className="mt-3 space-y-1">
          {driverLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active(l.href) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{l.icon}</span>
              {l.label}
            </Link>
          ))}
          <div className="border-t border-slate-100 pt-2">
            {user.isOwner ? (
              <Link href="/owner" className="flex items-center gap-2.5 rounded-xl bg-violet-50 px-3 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100">
                🏠 Owner panel
              </Link>
            ) : (
              <Link href="/dashboard/settings?becomeOwner=1" className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100">
                🏠 Start earning as owner
              </Link>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
}
