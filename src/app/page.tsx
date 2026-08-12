import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import HeroMockup from "@/components/HeroMockup";
import ParkingCard from "@/components/ParkingCard";
import { prisma } from "@/lib/db";
import type { SearchResultItem } from "@/lib/types";

async function getFeatured(): Promise<SearchResultItem[]> {
  const spaces = await prisma.parkingSpace.findMany({
    where: { status: "ACTIVE" },
    include: { images: true },
    orderBy: [{ rating: "desc" }],
    take: 6,
  });
  return spaces.map((s) => {
    let allowedTypes: string[] = ["CAR"];
    try {
      allowedTypes = JSON.parse(s.allowedTypes);
    } catch {
      /* ignore */
    }
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      lat: s.lat,
      lng: s.lng,
      address: s.address,
      landmark: s.landmark,
      spaceType: s.spaceType,
      allowedTypes,
      isCovered: s.isCovered,
      isIndoor: s.isIndoor,
      hasCCTV: s.hasCCTV,
      hasLighting: s.hasLighting,
      hasEV: s.hasEV,
      pricePerHour: s.pricePerHour,
      currency: s.currency,
      openHour: s.openHour,
      closeHour: s.closeHour,
      verificationStatus: s.verificationStatus,
      rating: s.rating,
      ratingCount: s.ratingCount,
      image: s.images.find((i) => i.isPrimary)?.url ?? s.images[0]?.url ?? "",
      distanceKm: null,
      score: 0,
      reasons: [],
    };
  });
}

const driverSteps = [
  { icon: "🔍", title: "Search", body: "Open MYSPOT and search for parking near your destination." },
  { icon: "⚖️", title: "Compare", body: "See verified spaces with transparent pricing and security details." },
  { icon: "📅", title: "Book", body: "Pick your slot, vehicle and time — pay securely online." },
  { icon: "🔐", title: "Verify", body: "Check in with your OTP. The owner authorizes your vehicle." },
  { icon: "🅿️", title: "Park", body: "Park with peace of mind. Extend, check out, and review." },
];

const ownerSteps = [
  { icon: "📋", title: "List", body: "List your driveway, garage or society slot in minutes." },
  { icon: "🕐", title: "Set availability", body: "Choose hours, prices and vehicle types — or auto-approve." },
  { icon: "✅", title: "Approve", body: "Confirm bookings and authorize vehicles before they arrive." },
  { icon: "💰", title: "Earn", body: "Watch earnings grow — transparent payouts every time." },
];

const faqs = [
  {
    q: "How do I know a parking space is trustworthy?",
    a: "Spaces are verified by MYSPOT, drivers check in with a secure OTP, and owners authorize every vehicle. Every booking has a transparent record and incident reporting is always available.",
  },
  {
    q: "How does the owner authorize my vehicle?",
    a: "When you book, the owner sees your vehicle details. They approve the booking, and check-in only works after approval — so an unrelated vehicle can never use the space.",
  },
  {
    q: "What happens if I'm late or need to stay longer?",
    a: "You can extend your booking in-app if the next slot is free. If you overstay, a fair overtime charge is applied automatically at check-out.",
  },
  {
    q: "How does the owner earn money?",
    a: "Every completed booking pays the owner directly, minus a transparent platform commission. Owners can track earnings and request payouts from their dashboard.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Yes — cancellations follow a clear, published policy: full refund up to 24h before start, 50% from 24h to 2h before, and no refund inside the final 2 hours.",
  },
  {
    q: "What if something goes wrong during parking?",
    a: "Report an incident from the app. Our admin team reviews evidence, investigates, and keeps you updated — every step is logged.",
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const featured = await getFeatured();

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute -left-32 -top-32 size-[480px] rounded-full bg-brand-600/40 blur-[120px] animate-float" />
        <div className="absolute -right-24 top-40 size-[420px] rounded-full bg-violet-600/40 blur-[110px] animate-float-slow" />
        <div className="absolute bottom-0 left-1/3 size-[360px] rounded-full bg-cyan-500/30 blur-[100px] animate-pulse-soft" />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-brand-200 backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                Peer-to-peer smart parking marketplace
              </span>
            </Reveal>

            <Reveal delay={100}>
              <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Park nearby.
                <br />
                Park <span className="text-gradient">securely</span>.
                <br />
                <Typewriter words={["Park smart.", "Earn from home.", "Skip the hunt."]} className="text-gradient" />
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                Find trusted parking near your destination — or turn your unused parking space into extra income.
                No more circling the block. No more roadside risk.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/parking"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-brand-600/40 transition-all hover:-translate-y-0.5 hover:bg-brand-500 hover:shadow-2xl hover:shadow-brand-500/50 sm:w-auto"
                >
                  Find Parking
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/10 sm:w-auto"
                >
                  List Your Parking
                </Link>
              </div>
            </Reveal>

            <Reveal delay={350}>
              <HeroMockup />
            </Reveal>

            <Reveal delay={500}>
              <div className="mt-16 grid grid-cols-2 gap-6 border-t border-white/10 pt-10 sm:grid-cols-4">
                {[
                  { v: 120, s: "+", label: "Cities ready" },
                  { v: 50, s: "k+", label: "Spaces listed" },
                  { v: 4.8, s: "★", label: "Average rating", dec: true },
                  { v: 100, s: "%", label: "OTP-verified check-ins" },
                ].map((x) => (
                  <div key={x.label} className="text-center">
                    <p className="font-display text-3xl font-extrabold text-white">
                      {x.dec ? (
                        <CountUp to={x.v * 10} duration={1800} />
                      ) : (
                        <CountUp to={x.v} duration={1800} suffix={x.s} />
                      )}
                      {x.dec ? x.s : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{x.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-brand-600">How MYSPOT works</span>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-900">
              Two sides, one simple idea
            </h2>
            <p className="mt-4 text-slate-500">
              Drivers escape the parking hunt. Homeowners turn empty space into income. Everyone wins.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-brand-50/60 to-white p-8">
              <h3 className="font-display text-xl font-bold text-slate-900">For drivers 🚗</h3>
              <ol className="mt-6 space-y-5">
                {driverSteps.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-lg font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        <span className="mr-1.5">{s.icon}</span>
                        {s.title}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-violet-50/60 to-white p-8">
              <h3 className="font-display text-xl font-bold text-slate-900">For owners 🏠</h3>
              <ol className="mt-6 space-y-5">
                {ownerSteps.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/10 text-lg font-bold text-violet-700">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        <span className="mr-1.5">{s.icon}</span>
                        {s.title}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- FEATURED PARKING ---------- */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="text-sm font-bold uppercase tracking-widest text-brand-600">Find nearby parking</span>
                <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-900">
                  Top-rated spaces near you
                </h2>
              </div>
              <Link href="/parking" className="group inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700">
                Browse all parking <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item, i) => (
              <Reveal key={item.id} delay={i * 80}>
                <ParkingCard item={item} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- SECURITY & TRUST ---------- */}
      <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
        <div className="absolute -right-40 top-0 size-[420px] rounded-full bg-brand-600/30 blur-[120px]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-bold uppercase tracking-widest text-brand-400">Security & trust</span>
              <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight">
                Security is not a feature. It&apos;s the foundation.
              </h2>
              <p className="mt-4 text-slate-400">
                We&apos;re turning private homes into public parking — so trust is engineered into every step.
              </p>
            </div>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "✅", title: "Verified spaces", body: "Every listing is reviewed by MYSPOT admins before it earns the Verified badge." },
              { icon: "🔢", title: "OTP + QR check-in", body: "A unique code verifies your vehicle at the gate. No code, no parking." },
              { icon: "👤", title: "Owner authorization", body: "Owners approve every vehicle. Strangers can never use a booked slot." },
              { icon: "🛡️", title: "Incident protection", body: "Report issues in-app. Admins investigate with a full audit trail." },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-brand-500/50 hover:bg-white/10">
                  <div className="text-3xl">{f.icon}</div>
                  <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- PROBLEM / SOLUTION ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-brand-600">Why MYSPOT</span>
              <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-900">
                Cities are full. Homes have space. Let&apos;s connect them.
              </h2>
              <p className="mt-4 leading-relaxed text-slate-500">
                In dense cities, land is occupied by homes — and parking is left to the roadside, where vehicles face
                congestion, risk and uncertainty. MYSPOT unlocks the parking capacity that already exists in homes,
                societies and businesses. No new land. No new construction. Just smarter use of space.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Cut parking-search time and road congestion",
                  "Homeowners earn steady extra income from idle space",
                  "Drivers get safe, pre-booked, verified parking",
                  "CCTV-ready and incident-protected for peace of mind",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-3 text-slate-700">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <Link href="/parking" className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-brand-600/30 transition hover:bg-brand-700">
                  Find Parking
                </Link>
                <Link href="/register" className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-700">
                  List Your Parking
                </Link>
              </div>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-200 via-violet-200 to-cyan-200 opacity-60 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
                <div className="relative h-72 w-full">
                  <Image src="https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?q=80&w=1200&auto=format&fit=crop" alt="Dense urban street with parked cars" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 rounded-xl bg-white/90 px-4 py-3 backdrop-blur">
                    <p className="font-display text-lg font-extrabold text-slate-900">₹15,000+</p>
                    <p className="text-xs text-slate-500">average yearly income per listed home space*</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-500">
                    *Illustrative figure for demo purposes. Actual earnings depend on location, hours and demand.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal>
            <div className="text-center">
              <span className="text-sm font-bold uppercase tracking-widest text-brand-600">FAQ</span>
              <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-900">Questions, answered</h2>
            </div>
          </Reveal>
          <div className="mt-10 space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
                <FaqItem q={f.q} a={f.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-violet-700 py-24 text-white">
        <div className="absolute -left-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 size-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Ready to never hunt for parking again?
            </h2>
            <p className="mt-4 text-lg text-brand-100">
              Join MYSPOT today. Park smart — or start earning from your driveway.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register" className="rounded-2xl bg-white px-8 py-4 text-base font-bold text-brand-700 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl">
                Create free account
              </Link>
              <Link href="/parking" className="rounded-2xl border border-white/40 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/20">
                Browse parking
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-300">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
        {q}
        <span className="text-brand-600 transition-transform duration-300 group-open:rotate-45">＋</span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-slate-500">{a}</p>
    </details>
  );
}
