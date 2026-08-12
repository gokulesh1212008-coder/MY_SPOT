import { redirect } from "next/navigation";
import { getCurrentUser, publicUser } from "@/lib/auth";
import DashboardNav from "@/components/DashboardNav";
import RemindersTrigger from "@/components/RemindersTrigger";
import MobileBottomNav from "@/components/MobileBottomNav";

export const metadata = { title: "My Dashboard — MYSPOT" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const clientUser = publicUser(user);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 md:pb-8">
      <RemindersTrigger />
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className="hidden lg:block">
          <DashboardNav user={clientUser} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
