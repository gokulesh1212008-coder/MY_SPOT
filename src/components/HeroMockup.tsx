"use client";

export default function HeroMockup() {
  return (
    <div className="relative mx-auto mt-16 max-w-sm sm:max-w-md">
      {/* Glow behind the phone */}
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-500/40 via-violet-500/40 to-cyan-500/30 blur-2xl" />

      {/* Phone frame */}
      <div className="relative rounded-[2.25rem] border border-white/15 bg-slate-900/80 p-3 shadow-2xl backdrop-blur-xl">
        <div className="overflow-hidden rounded-[1.75rem] bg-slate-950">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pb-2 pt-4 text-[10px] text-slate-400">
            <span>9:41</span>
            <span className="h-5 w-24 rounded-full bg-slate-800" />
            <span>📶 🔋</span>
          </div>

          {/* App header */}
          <div className="px-5 pb-3">
            <div className="flex items-center justify-between">
              <p className="font-display text-base font-extrabold text-white">
                MY<span className="text-brand-400">SPOT</span>
              </p>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                📍 Colaba, Mumbai
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <span className="text-sm">🔍</span>
              <span className="text-xs text-slate-400">Gateway of India…</span>
              <span className="ml-auto rounded-lg bg-brand-600 px-2.5 py-1 text-[10px] font-bold text-white">Search</span>
            </div>
          </div>

          {/* Parking rows */}
          <div className="space-y-2 px-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Available nearby</p>
            {[
              { title: "Secure Driveway · Colaba", price: "₹60/hr", tag: "✓ Verified", color: "from-brand-500 to-violet-600", dist: "200 m" },
              { title: "Covered Garage · Fort", price: "₹80/hr", tag: "✓ CCTV", color: "from-cyan-500 to-sky-600", dist: "1.1 km" },
              { title: "EV Garage · Powai", price: "₹120/hr", tag: "⚡ EV", color: "from-emerald-500 to-teal-600", dist: "23 km" },
            ].map((row, i) => (
              <div
                key={row.title}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-transform hover:scale-[1.02]"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${row.color} text-sm`}>
                  🅿️
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{row.title}</p>
                  <p className="text-[10px] text-slate-400">
                    {row.dist} · {row.tag}
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-400">{row.price}</span>
              </div>
            ))}
          </div>

          {/* OTP check-in chip */}
          <div className="mx-5 mt-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 p-3">
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-white" />
            </span>
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-white">Booking MSP-584902 · Check in</p>
              <p className="font-mono text-lg font-bold tracking-[0.25em] text-white/90">4 8 2 1 9 6</p>
            </div>
            <span className="rounded-lg bg-white/20 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur">
              Verify
            </span>
          </div>

          {/* Bottom nav */}
          <div className="mt-4 grid grid-cols-4 gap-1 border-t border-white/10 px-5 py-3 text-center text-[9px] text-slate-500">
            <span className="text-brand-400">🏠<br />Home</span>
            <span>🗺️<br />Map</span>
            <span>📅<br />Bookings</span>
            <span>👤<br />Profile</span>
          </div>
        </div>
      </div>

      {/* Floating success toast */}
      <div className="absolute -right-4 top-16 animate-float rounded-2xl border border-emerald-400/40 bg-emerald-500/95 px-4 py-2.5 text-xs font-semibold text-white shadow-xl shadow-emerald-500/30 backdrop-blur">
        ✓ Booking confirmed!
      </div>
      {/* Floating security chip */}
      <div className="absolute -left-6 bottom-20 animate-float-slow rounded-2xl border border-white/20 bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur">
        🔐 OTP verified · owner approved
      </div>
    </div>
  );
}
