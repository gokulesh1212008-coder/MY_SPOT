import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

export const metadata = { title: "Admin — MYSPOT" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/dashboard");

  const links = [
    { href: "/admin", label: "Overview", icon: "📊" },
    { href: "/admin/users", label: "Users", icon: "👥" },
    { href: "/admin/parking", label: "Parking", icon: "🅿️" },
    { href: "/admin/bookings", label: "Bookings", icon: "📅" },
    { href: "/admin/payments", label: "Payments", icon: "💳" },
    { href: "/admin/incidents", label: "Incidents", icon: "🛡️" },
    { href: "/admin/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Admin console</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor, verify, manage and secure the MYSPOT platform.</p>
      </div>
      <div className="mb-8 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <span className="mr-1.5">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
