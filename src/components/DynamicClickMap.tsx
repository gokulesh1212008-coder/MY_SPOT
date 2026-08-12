"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const ClickMap = dynamic(() => import("./ClickMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full animate-pulse rounded-2xl border border-slate-200 bg-slate-100" style={{ height: 320 }} />
  ),
});

export default function DynamicClickMap(props: ComponentProps<typeof ClickMap>) {
  return <ClickMap {...props} />;
}
