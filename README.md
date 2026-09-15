# KaggleScope

KaggleScope is an independent analytics and discovery platform for competitive Kaggle. It is not affiliated with or endorsed by Kaggle or Google.

## Status

Part 1 establishes the application foundation. Product screens, PostgreSQL, ETL, scoring, and live Kaggle data are intentionally deferred to later implementation parts.

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
