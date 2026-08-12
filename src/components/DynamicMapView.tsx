"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full animate-pulse rounded-2xl border border-slate-200 bg-slate-100" style={{ height: 420 }} />
  ),
});

export default function DynamicMapView(props: ComponentProps<typeof MapView>) {
  return <MapView {...props} />;
}
