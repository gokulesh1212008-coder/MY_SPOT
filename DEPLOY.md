# 🚀 Deploying MYSPOT

MYSPOT is deploy-ready: a standalone production server (`next build` + `next start`), a Docker image, and configs for the major platforms. Choose the path that fits.

---

## 0. Everything you must configure first

| Env var | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Local dev: `file:./dev.db`. Production: **PostgreSQL** recommended — e.g. `postgresql://user:pass@host:5432/myspot` |
| `SESSION_SECRET` | ✅ | Long random string: `openssl rand -hex 32` |
| `PAYMENT_PROVIDER` | ✅ | `sandbox` (demo) · `stripe` · `razorpay` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | live payments | for Stripe |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | live payments | for Razorpay |
| `SMS_PROVIDER` + `SMS_API_KEY` | OTP via SMS | without it, OTPs are logged to the server console (dev fallback) |
| `SMTP_HOST/PORT/USER/PASS` | emails | password resets, receipts |

Run migrations on the production database once:

```bash
npx prisma migrate deploy
```

Optionally seed demo data: `npm run db:seed` (only for staging/demo — never on a real production DB).

---

## 1. Option A — Vercel (fastest for frontend + API)

1. Push this repo to GitHub.
2. In Vercel → **Add New Project** → import the repo.
3. Framework preset: **Next.js** (auto-detected). Build command `npm run build`, output auto.
4. Add the environment variables from the table above (use a hosted Postgres like **Neon** or **Supabase** for `DATABASE_URL`).
5. Deploy. Health check: `https://your-app.vercel.app/api/health` → `{"status":"ok"}`.

> Vercel serverless functions run Prisma fine; ensure `DATABASE_URL` points to Postgres (SQLite files don't persist on serverless).

## 2. Option B — Railway / Render (full server with database)

1. Create a Postgres database on the platform, copy its connection string into `DATABASE_URL`.
2. Deploy from the repo (Railway auto-detects the Dockerfile; Render: **New Web Service** → repo → Docker).
3. Set the env vars, then run `npx prisma migrate deploy` via the platform's shell/start hook.
4. Add a health check on `/api/health` for zero-downtime restarts.

## 3. Option C — Docker anywhere (VPS, Fly.io, K8s)

```bash
# build
docker build -t myspot .

# run with a persistent volume for SQLite (single-node) …
docker run -d -p 3000:3000 -v myspot-data:/data \
  -e DATABASE_URL="file:/data/myspot.db" \
  -e SESSION_SECRET="$(openssl rand -hex 32)" \
  myspot

# … or point at Postgres for multi-instance scale-out
docker run -d -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/myspot" \
  -e SESSION_SECRET="$(openssl rand -hex 32)" \
  myspot
```

First boot: `docker exec -it <container> npx prisma migrate deploy && npm run db:seed` (seed only for demo).

---

## 4. Verify a deployment

```bash
curl https://your-app/api/health          # {"status":"ok","db":"up"}
curl https://your-app/                    # 200, landing page
```

Then run the end-to-end suite against it:

```bash
MSPOT_SERVER_LOG=/path/to/server.log bash scripts/smoke-test.sh
```

(The smoke test expects an SMS-style OTP log line; with a real SMS provider you can read the OTP from the phone instead — or set `MSPOT_SERVER_LOG` to the container log file.)

---

## 4.5 Step-by-step: push to GitHub → connect Vercel (first deploy)

### A. Create the GitHub repository

1. Go to https://github.com/new
2. Repository name: `myspot` (or anything you like). Keep it **Public** or **Private** — your choice.
3. Do **NOT** tick "Add a README", ".gitignore" or "license" — this project already has them.
4. Click **Create repository**.

### B. Push this project to GitHub

Open a terminal in this folder (`D:\FREEBUFF`) and run:

```bash
# 1. Point git at your repo (replace USERNAME with your GitHub username)
git remote add origin https://github.com/USERNAME/myspot.git

# 2. Push the code
#    (GitHub will ask for your username + a Personal Access Token as password —
#     create one at github.com/settings/tokens → "Generate new token (classic)" →
#     tick the "repo" scope → copy it; treat it like a password)
git branch -M main
git push -u origin main
```

### C. Create a database on Neon (free Postgres)

Vercel's serverless functions can't use the local SQLite file, so the app needs a hosted Postgres:

1. Go to https://neon.tech → sign up → **Create a project** (name: `myspot`).
2. In the project dashboard copy the **connection string** — it looks like:
   `postgresql://neondb_owner:xxxx@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`
3. Keep it for the next step.

### D. Deploy on Vercel

1. Go to https://vercel.com → **Add New… → Project** → **Import** the `myspot` repo.
2. Vercel auto-detects Next.js. Leave framework preset and build command as defaults (`npm run build`).
3. Click **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from step C |
   | `SESSION_SECRET` | run `openssl rand -hex 32` locally and paste the result |
   | `PAYMENT_PROVIDER` | `sandbox` (until you wire a live gateway) |
4. Click **Deploy**. Wait ~2 minutes.
5. Open your project URL (e.g. `https://myspot-xxxx.vercel.app`) and check:

```bash
curl https://myspot-xxxx.vercel.app/api/health   # → {"status":"ok","db":"up"}
```

### E. Create the database tables (one time)

Vercel: go to your project → **Settings → Environment Variables** is where env vars live; run migrations from the Vercel CLI:

```bash
npm i -g vercel
vercel env pull .env.production   # fetch your production env vars into a local file
npx prisma migrate deploy --schema prisma/schema.prisma
```

Or use the terminal in the Neon console / any machine with the `DATABASE_URL` set:

```bash
DATABASE_URL="postgresql://…" npx prisma migrate deploy
```

> Only run `npm run db:seed` if you want demo data on the production DB — **not** recommended.

### F. Every later deploy is automatic

Any push to `main` on GitHub triggers a fresh Vercel deploy automatically. To update the app:

```bash
git add . && git commit -m "your change" && git push
```

---

## 5. Going live checklist (production quality)

- [ ] PostgreSQL + `prisma migrate deploy` run
- [ ] Strong `SESSION_SECRET`
- [ ] Live payment provider configured (implement the SDK calls in `src/lib/payments/provider.ts`)
- [ ] SMS + SMTP providers configured
- [ ] Error tracking (e.g. Sentry) wired to `/api/health` and server logs
- [ ] HTTPS everywhere; cookies are already `httpOnly` + `SameSite=lax` (`Secure` in prod)
- [ ] Backups enabled on the database
- [ ] Smoke test passing against the production URL
