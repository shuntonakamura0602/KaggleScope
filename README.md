# KaggleScope

KaggleScope is an independent analytics and discovery platform for competitive Kaggle. It is not affiliated with or endorsed by Kaggle or Google.

## Status

Part 2 provides the static product experience using 20 fictional Kagglers:

- Home discovery surface
- Overall, Momentum, Solo, and Consistency rankings
- Kaggler profiles with scores, specialties, and competition history
- Responsive desktop and mobile layouts
- Loading, empty, and not-found states

PostgreSQL, ETL, score calculation, search behavior, and live Kaggle data are intentionally deferred to later implementation parts.

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

## Data and methodology

The planned production data source is the publicly available Meta Kaggle dataset. KaggleScope metrics are unofficial and will be documented with a score version and transparent formulas before data-backed pages are released.
