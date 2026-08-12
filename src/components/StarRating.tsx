"use client";

import { useState } from "react";

export function StarRating({ value, onChange, size = "text-lg" }: { value: number; onChange?: (v: number) => void; size?: string }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex items-center gap-0.5" role={onChange ? "radiogroup" : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`${size} transition-transform ${onChange ? "cursor-pointer hover:scale-125" : "cursor-default"} ${
            n <= active ? "text-amber-400" : "text-slate-300"
          }`}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
