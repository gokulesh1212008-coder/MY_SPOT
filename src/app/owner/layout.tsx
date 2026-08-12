import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

export const metadata = { title: "Owner Panel — MYSPOT" };

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isOwner && !user.isAdmin) redirect("/dashboard");

  const links = [
    { href: "/owner", label: "Overview", icon: "📊" },
    { href: "/owner/listings", label: "My listings", icon: "🅿️" },
    { href: "/owner/bookings", label: "Bookings", icon: "📅" },
    { href: "/owner/payouts", label: "Payouts", icon: "💰" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Owner panel</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your parking spaces and earnings.</p>
      </div>
      <div className="mb-8 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition",
              "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <span className="mr-1.5">{l.icon}</span>
            {l.label}
          </Link>
        ))}
        <Link href="/owner/listings/new" className="ml-auto whitespace-nowrap rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700">
          + List new space
        </Link>
      </div>
      {children}
    </div>
  );
}
