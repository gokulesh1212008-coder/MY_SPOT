"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/map", label: "Home", icon: "🏠" },
  { href: "/slots", label: "Slots", icon: "🅿️" },
  { href: "/report", label: "Report", icon: "🛡️" },
  { href: "/dashboard/bookings", label: "Bookings", icon: "📅" },
  { href: "/dashboard", label: "Profile", icon: "👤" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition",
              active(it.href) ? "text-brand-600" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <span
              className={cn(
                "flex h-7 w-12 items-center justify-center rounded-full text-base transition",
                active(it.href) && "bg-brand-50"
              )}
            >
              {it.icon}
            </span>
            {it.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
