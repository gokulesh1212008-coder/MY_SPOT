# MYSPOT — Quick Start (run it anywhere in ~2 minutes)

The app is a Next.js 15 full-stack app with a Prisma + SQLite (dev) database.
**The database and `.env` are intentionally NOT in the repo** (secrets / local
state), so a fresh clone needs the steps below. Follow them in order and the
app will start.

## 1. Get the code

```bash
git clone https://github.com/gokulesh1212008-coder/MY_SPOT.git
cd MY_SPOT
```

## 2. Install dependencies

```bash
npm install
```
`postinstall` runs `prisma generate` automatically. If it was skipped:
```bash
npx prisma generate
```

## 3. Create the env file

```bash
cp .env.example .env
```
The defaults work out of the box (SQLite, sandbox payments). Only change
`SESSION_SECRET` if you want — any long random string is fine for dev.

## 4. Build the database + load demo data

```bash
npx prisma migrate deploy   # creates the SQLite DB from the schema
npm run db:seed             # loads demo parking spaces + accounts
```

## 5. Start the app

```bash
npm run dev -- -p 3000
```
> The `--` is required — without it npm swallows `-p` as its own flag.
> If the sandbox sets a `PORT` env var, `-p 3000` pins it regardless.

Open **http://localhost:3000** and sign in with the demo buttons on the login
page (or `driver@myspot.app` / `owner@myspot.app` / `admin@myspot.app`,
password `demo1234`).

---

## In VS Code (easiest)

1. **File → Open Folder** → select the project
2. Open **`myspot.code-workspace`** (recommended extensions + tasks load automatically)
3. **Terminal → Run Task… → "Run Next.js dev server"** (or Ctrl+Shift+B)
4. Open http://localhost:3000

## In Google Antigravity

1. Create a workspace → **Import from GitHub** → `gokulesh1212008-coder/MY_SPOT`
2. Run the terminal commands from steps 2–5 above
3. Click the **Preview** button — the app opens at the forwarded URL

## Production / deploy

See **DEPLOY.md** (Vercel, Railway, or Docker). For production use PostgreSQL
(`DATABASE_URL`) and set a real `SESSION_SECRET`.

---

### Common issues

| Symptom | Cause / fix |
| --- | --- |
| `PrismaClientInitializationError` or `table ... does not exist` | You skipped step 4 — run `npx prisma migrate deploy` |
| No parking spaces / empty pages | Run `npm run db:seed` |
| Login fails | The seed must have run; use `demo1234` for all demo accounts |
| App starts on a random port | Use `npm run dev -- -p 3000` (with `--`) |
| `EACCES`/port in use | Pick another port: `npm run dev -- -p 3001` |
| Home page 500s while seeding | Transient SQLite lock — retry the request (auto-retry is built in) |
