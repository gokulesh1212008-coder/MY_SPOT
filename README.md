# 🅿️ MYSPOT — Peer-to-Peer Smart Parking Marketplace

> **Park nearby. Park securely. Park smart.**

MYSPOT turns unused residential parking spaces into trusted, bookable parking. Drivers find and pre-book verified parking near their destination; homeowners (and societies/businesses) list their unused space and earn income — no new land, no new construction, just smarter use of space.

This is a **complete, working full-stack MVP** — not a mockup. Every included flow is implemented end-to-end with a real database, real validation, real authorization, and an honest payment architecture.

---

## ✨ What's built

### Drivers 🚗
- Sign up / sign in / password reset (hashed passwords, httpOnly sessions)
- Register vehicles (type, model, colour, registration) — every booking is tied to an authorized vehicle
- **Search**: map view (Leaflet/OSM, keyless) + list view, filters (price, covered, CCTV, EV, rating, vehicle type), date/time availability
- **Smart recommendations**: ranked by distance, price, rating and security, with human-readable reasons ("CCTV + covered", "Fits your vehicle")
- **Booking engine**: real conflict prevention (double-booking returns 409), operating-hours and max-duration checks, transparent price breakdown (base + fee + tax + convenience)
- **Sandbox payment**: provider abstraction (`sandbox`/`stripe`/`razorpay`); booking is only confirmed after payment succeeds; refunds route through the same provider
- **OTP + QR check-in**: unique QR per booking, 6-digit OTP (hashed, 15-min expiry, 5 attempts), wrong-code rejection, owner must have approved the vehicle
- Extend bookings (conflict-checked), check-out with automatic overtime charge, cancel with tiered refunds (full ≥24h, 50% to 2h, none inside 2h)
- Reviews (only after completion, once per booking), favorites, notification center with reminders, incident reporting, wallet-style payout visibility

### Owners 🏠
- Become an owner, list spaces with a **click-to-pin map**, photos, hours, pricing, vehicle compatibility, facilities (CCTV, covered, indoor, EV, lighting)
- Instant approval or manual per-booking approval — vehicles are authorized before arrival
- Earnings dashboard (today / week / month / lifetime), occupancy and peak-hour analytics, payout requests

### Admins 🛡️
- Platform analytics (users, bookings, revenue, commission, popular spaces)
- Parking **verification workflow** (pending → verified / rejected / suspended) with owner notifications
- User management (owner/admin toggles), all bookings, all payments/refunds, incident investigation & resolution
- Configurable business rules: commission %, fee %, tax %, convenience fee, refund windows, max booking length

---

## 🧰 Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript (strict) |
| Styling | Tailwind CSS v4 + design tokens |
| Database | Prisma ORM + SQLite (dev) — switch `DATABASE_URL` to PostgreSQL for production |
| Auth | Custom session auth: bcrypt hashing, httpOnly cookie sessions, role guards (driver/owner/admin) |
| Maps | Leaflet + OpenStreetMap (keyless) |
| QR | `qrcode` (server-rendered) |
| Payments | Provider abstraction — sandbox by default; Stripe/Razorpay stubs ready |
| Tests | Vitest (25 unit tests) + `scripts/smoke-test.sh` (16 end-to-end API checks) |

---

## 🚀 Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env        # SQLite dev DB is the default

# 3. Create the database & seed demo data
npx prisma migrate dev --name init
npm run db:seed

# 4. Run
npm run dev                 # → http://localhost:3000
```

### Demo accounts (password: `demo1234`)

| Role | Email |
|---|---|
| Driver | `driver@myspot.app` |
| Owner | `owner@myspot.app` |
| Owner 2 | `owner2@myspot.app` |
| Admin | `admin@myspot.app` |

### Try the full journey
1. Sign in as **driver** → browse `/parking` → open a space → **Book This Parking** (sandbox payment, OTP shown in dev)
2. The **owner** sees the booking → approve it (manual-approval spaces) → driver checks in with the OTP at `/dashboard/bookings/[id]`
3. Check out, leave a review, request a refund — then verify everything in the **admin** console

---

## 🧪 Testing & quality gates

```bash
npm run typecheck     # strict TypeScript
npm run lint          # ESLint
npm test              # 25 unit tests (pricing, conflicts, refunds, OTP, geo)
bash scripts/smoke-test.sh   # 16 end-to-end API checks (resets demo data first)
npm run build         # production build
```

The smoke test proves the real flows: login → search → book → double-booking blocked → owner approval → wrong OTP rejected → OTP check-in → checkout → review → duplicate review blocked → cancel with refund → owner earnings → admin analytics → configurable commission → unauthenticated access blocked.

---

## 💳 Payments — honest architecture, sandbox by default

MYSPOT **never stores card details**. All charges go through a provider abstraction in `src/lib/payments/provider.ts`.

- `PAYMENT_PROVIDER=sandbox` (default): simulated gateway, clearly labelled in the UI ("no real money"). Booking is confirmed **only after** payment succeeds; failures cancel the booking; refunds call the provider.
- `PAYMENT_PROVIDER=stripe` or `razorpay`: real integration — set the required env keys. The provider stubs throw a clear "not configured" error so the app can never silently claim a payment succeeded. Wire the official SDK call in the marked spot in `provider.ts`.

### Going live checklist
1. Set `DATABASE_URL` to PostgreSQL and run `npx prisma migrate deploy`
2. Set `SESSION_SECRET` to a long random string
3. Configure `PAYMENT_PROVIDER` + provider keys; implement the charge/refund SDK calls in `src/lib/payments/provider.ts`
4. Configure `SMTP_*` for email and `SMS_PROVIDER`/`SMS_API_KEY` for OTP delivery (currently logged to the server console as a dev fallback)
5. Set `MAP_PROVIDER=mapbox` + `MAPBOX_TOKEN` if you want Mapbox tiles instead of OSM
6. Deploy to Vercel/Railway, add Sentry for error tracking, and run the smoke test against staging

---

## 🔐 Security & trust features

- OTP check-in (SHA-256 hashed, 15-min expiry, 5 attempts, timing-safe compare) + per-booking QR
- Owner authorization: check-in is impossible until the owner approves the vehicle
- Double-booking prevention inside a DB transaction; booking validated against operating hours & max duration
- Role-based access on every API route; IDOR-safe ownership checks on bookings/vehicles/reviews/listings
- Server-side input validation everywhere; never trust client data
- Audit log for auth, bookings, payments, approvals, admin actions and incidents
- Privacy-first: exact residential locations are never exposed before booking; no live CCTV streaming — CCTV exists for incident investigation only

---

## 🗄️ Database

22 models: `User`, `Session`, `Vehicle`, `ParkingSpace`, `ParkingImage`, `Booking`, `Payment`, `Review`, `Favorite`, `Notification`, `Incident`, `WalletTransaction`, `Payout`, `PlatformSetting`, `AuditLog`. See `prisma/schema.prisma`.

Business rules (commission, fees, refund windows) live in `PlatformSetting` — configurable from the admin panel, never hard-coded.

---

## 📁 Project structure

```
src/
  app/                 # Routes (pages + API handlers)
    api/               # ~30 REST endpoints (auth, vehicles, parking, bookings,
                       #   checkin/checkout/extend/approve/review, payments,
                       #   favorites, notifications, incidents, owner, admin)
    dashboard/         # Driver app
    owner/             # Owner panel
    admin/             # Admin console
    parking/           # Search + details
  components/          # UI primitives, map, booking widget, QR, navbar…
  lib/                 # auth, db, settings, pricing, booking, otp, geo,
                       #   search, payments provider, notifications, audit
prisma/
  schema.prisma        # Database schema
  seed.ts              # Demo data
scripts/
  smoke-test.sh        # End-to-end API test
```

---

## 🧭 What's next (beyond this MVP)

The architecture already anticipates these — database models and structure are ready:

- **Organizations / societies**: multi-space inventory with per-slot permissions (modeled via `isOwner` users owning many spaces)
- **Live payments**: Stripe/Razorpay SDK calls in the provider
- **Real SMS/email/push**: wire providers into `src/lib/notify.ts`
- **Object storage** for photo uploads (currently image URLs)
- **PWA**: manifest + service worker for installable mobile experience
- **Rewards/coupons**: `WalletTransaction` and settings are in place
- **Monthly subscription parking** and **event parking** pricing modes

---

Built with the AURORA persona standards: mobile-first, accessible (WCAG AA basics), 60fps CSS/GPU-friendly animations, and a mandatory quality gate before delivery.
