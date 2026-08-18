"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const LiveMap = dynamic(() => import("./LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full animate-pulse rounded-2xl border border-slate-200 bg-slate-100" style={{ height: 460 }} />
  ),
});

export default function DynamicLiveMap(props: ComponentProps<typeof LiveMap>) {
  return <LiveMap {...props} />;
}
