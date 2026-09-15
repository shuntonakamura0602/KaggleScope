# KaggleScope

KaggleScope is an independent analytics and discovery platform for competitive Kaggle. It is not affiliated with or endorsed by Kaggle or Google.

## Status

Part 3 provides the PostgreSQL and Drizzle persistence foundation while the UI continues to use 20 fictional Kagglers:

- Home discovery surface
- Overall, Momentum, Solo, and Consistency rankings
- Kaggler profiles with scores, specialties, and competition history
- Responsive desktop and mobile layouts
- Loading, empty, and not-found states
- PostgreSQL schema, constraints, indexes, and generated migrations
- Idempotent preview seed for Kagglers and score tables

ETL, production score calculation, search behavior, and live Kaggle data are intentionally deferred to later implementation parts.

## Stack

- Next.js App Router
- React and TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui primitives
- Lucide icons

## Local development

Requirements: Node.js 22.13 or newer.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:5173`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

## Environment variables

See `.env.example`. Secrets must only be stored in ignored local environment files and must never be committed.

## Database setup

KaggleScope targets PostgreSQL 15 or newer. Set `DATABASE_URL` in `.env.local` to a PostgreSQL or Supabase connection URL, then run:

```bash
npm run db:migrate
npm run db:seed
```

Useful database commands:

```bash
npm run db:generate # generate a migration after a schema change
npm run db:migrate  # apply committed migrations
npm run db:seed     # upsert the 20 preview Kagglers and their scores
npm run db:studio   # inspect the configured database
```

Migration files under `db/migrations` are committed and must remain immutable after they have been applied to a shared database. The PostgreSQL client is intended for a Node.js server runtime and is not imported by the current static pages.

## Data and methodology

The planned production data source is the publicly available Meta Kaggle dataset. KaggleScope metrics are unofficial and will be documented with a score version and transparent formulas before data-backed pages are released.
