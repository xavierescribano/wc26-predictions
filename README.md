# ⚽ WC26 Predictions

A full-stack World Cup 2026 prediction league for friends. Players earn points by predicting match outcomes across all tournament phases.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| ORM | Prisma 5 |
| Database | PostgreSQL (Supabase) |
| Auth | NextAuth.js v4 (JWT, Credentials) |

---

## Features

- **Group Stage Picks** — predict final standings (1st–4th) for all 12 groups
- **Knockout Picks** — pick winners for R32, R16, QF, SF, and Final
- **Golden Pick** — pick the tournament winner (penalty for changing)
- **Leaderboard** — real-time standings with per-phase point breakdown
- **Admin Panel** — invite players, open/close phases, enter results, score predictions automatically

---

## Scoring

| Event | Points |
|-------|--------|
| Correct group position | +1 |
| Perfect group (all 4) | +1 bonus (max 5/group) |
| Correct knockout pick | +1 |
| Perfect round (all picks correct) | +5 bonus |
| Correct Final winner | +25 |
| Golden Pick — 0 changes | +50 |
| Golden Pick — 1 change | +40 |
| Golden Pick — 2 changes | +30 |
| Each additional change | −10 (floor 0) |

---

## Setup

### 1. Prerequisites

- Node.js ≥ 18
- A [Supabase](https://supabase.com) project (free tier works)

### 2. Clone and install

```bash
git clone <repo-url>
cd wc26-predictions
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
# From Supabase → Settings → Database → Connection string (Transaction mode = pgbouncer)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# From Supabase → Settings → Database → Connection string (Session mode = direct)
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="a-strong-password"
```

### 4. Push schema and seed data

```bash
npm run db:push    # push schema to Supabase (no migration files)
npm run db:seed    # seed 48 teams, 6 phases, knockout matches, and the admin user
```

> **Tip:** Use `npm run db:migrate` instead of `db:push` if you want tracked migration files.

### 5. Run locally

```bash
npm run dev
# open http://localhost:3000
```

Log in with the admin credentials from `.env`. Use the Admin panel to invite players and open the Group Stage phase.

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Redirect (login or dashboard) |
| `/login` | Email + password sign-in |
| `/register?token=…` | Invite-only registration |
| `/dashboard` | Leaderboard + current phase status |
| `/picks/groups` | Group stage prediction grid |
| `/picks/[phase]` | Knockout bracket picks (`round-of-32`, `round-of-16`, `quarterfinals`, `semifinals`, `final`) |
| `/picks/golden` | Golden Pick with penalty warning |
| `/admin` | Admin panel (ADMIN role only) |
| `/profile` | Personal points breakdown |

---

## Admin Flow

1. **Invite players** — enter email → share the generated `/register?token=…` link
2. **Open Group Stage** — toggle GROUP_STAGE phase to OPEN
3. Players submit their group predictions
4. **Close Group Stage** — toggle to CLOSED (locks picks)
5. **Enter Group Results** — set final standings per group (auto-scores all predictions)
6. **Open R32** — repeat for each knockout phase
7. **Enter match results** — set home/away scores + winner (auto-scores knockout picks, applies round bonus)

---

## Database Schema

Core models: `User`, `Team`, `Phase`, `Match`, `GroupPrediction`, `GroupResult`, `KnockoutPick`, `GoldenPick`, `Invite`

Run `npm run db:studio` to explore data in Prisma Studio.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env`
4. Deploy — Vercel auto-detects Next.js

After first deploy, run the seed from local:
```bash
DATABASE_URL="your-direct-url" npm run db:seed
```
