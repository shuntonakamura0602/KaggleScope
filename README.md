# KaggleScope

KaggleScope is an independent analytics and discovery platform for competitive Kaggle. It is not affiliated with or endorsed by Kaggle or Google.

## Status

Part 6 connects the production data model to the web experience:

- Home discovery surface
- Overall, Momentum, Solo, and Consistency rankings
- Kaggler profiles with scores, specialties, and competition history
- Responsive desktop and mobile layouts
- Loading, empty, and not-found states
- PostgreSQL schema, constraints, indexes, and generated migrations
- Idempotent preview seed for Kagglers and score tables
- Python 3.12 and Polars ETL for the five required Meta Kaggle CSV files
- Competition Expert+ filtering and Kaggler, Competition, Team transforms
- Transactional PostgreSQL upserts with persisted ETL run status
- Valid Competition Result generation with Private Rank priority and Public Rank fallback
- Career, Solo, Consistency, and Momentum calculations using score version `0.1`
- Idempotent score upserts and daily ranking snapshots
- Server-side PostgreSQL queries for home, rankings, and Kaggler profiles
- 50-row ranking pagination and stored score-rank display
- Competition history, specialty score, and frequent-teammate queries
- Explicit fictional preview fallback when `DATABASE_URL` is not configured

Specialty classification and interactive search behavior are intentionally deferred to later implementation parts.

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

## Meta Kaggle ETL

Requirements: Python 3.12 or newer. Create an isolated environment and install the ETL package from the repository root:

```bash
python3.12 -m venv .venv
.venv/bin/python -m pip install -e './etl[dev]'
```

Set `DATABASE_URL` and configure Kaggle authentication with `KAGGLE_API_TOKEN`, `KAGGLE_USERNAME` plus `KAGGLE_KEY`, or `~/.kaggle/kaggle.json`. A production sync downloads only the required source files and performs transactional, idempotent upserts:

```bash
.venv/bin/python -m etl.sync
```

Validate an existing download without changing PostgreSQL:

```bash
.venv/bin/python -m etl.sync --skip-download --dry-run --data-dir etl/tests/fixtures/meta-kaggle
```

For a reproducible historical calculation, pass an explicit UTC date. Results after that date are excluded:

```bash
.venv/bin/python -m etl.sync --skip-download --dry-run --as-of 2025-01-01
```

Runtime CSV files and timestamped logs live under ignored `etl/data` and `etl/logs` directories. A failed database-backed run is recorded in `etl_runs`; the detailed exception remains in the local log.

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

Migration files under `db/migrations` are committed and must remain immutable after they have been applied to a shared database. The PostgreSQL client is used only by server-rendered data routes and requires a Node.js server runtime.

When `DATABASE_URL` is configured, the home page, ranking pages, and Kaggler profiles query the processed PostgreSQL tables on the server. Without it, the same routes visibly fall back to the 20 fictional preview records so local development and CI remain deterministic. A configured database error is surfaced instead of silently showing preview data.

## Data and methodology

The production data source is the publicly available Meta Kaggle dataset. KaggleScope metrics are unofficial and use the transparent `0.1` formulas documented in [`docs/scoring-v0.1.md`](docs/scoring-v0.1.md). Solo Power requires at least 3 solo results, Consistency Score requires at least 5 results, and Momentum covers the latest 365 days with 180-day exponential decay.
