"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({ to, duration = 1600, suffix = "", prefix = "" }: { to: number; duration?: number; suffix?: string; prefix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    // Respect prefers-reduced-motion: show the final value immediately.
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min((t - t0) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(to * eased);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {Math.round(value).toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
