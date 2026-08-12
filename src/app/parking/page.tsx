import { Suspense } from "react";
import SearchPage from "@/components/SearchPage";

export const metadata = { title: "Find Parking — MYSPOT" };

export default function ParkingPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-24 text-center text-slate-500">Loading parking search…</div>}>
      <SearchPage />
    </Suspense>
  );
}
