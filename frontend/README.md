# Tankha Frontend

React (Vite) SPA for Tankha — the HR salary system of record. Mantine + TanStack Query +
React Router + react-hook-form/zod, with a fully typed API client generated from the
backend's OpenAPI spec (no hand-written request/response shapes). See
[`../docs/architecture.md`](../docs/architecture.md) §7 for the design of record.

## Feature areas (`src/features/`)

| Module | Owns |
| --- | --- |
| `auth` | Login/signup, session (`AuthContext`) |
| `employees` | Employee list/create/edit/detail, plus the import/export UI (no standalone route) |
| `compensation` | Salary card, edit modal, revision timeline — rendered inside employee detail |
| `insights` | Dashboard: per-currency stat tiles, department/country breakdowns |

### Key conventions

- **The URL is the source of truth for list/filter state** — `useSearchParams()`, never
  local component state, so it doubles as the TanStack Query cache key (refresh-safe,
  shareable, and the employee list and dashboard always describe the same filtered
  population).
- **Money** — every currency figure goes through `lib/money.ts`'s `formatMoney`
  (`Intl.NumberFormat`-based, Indian digit grouping for INR), never hand-formatted.
- **Currency identity in charts** is a fixed, CVD-validated palette (`theme.ts`'s
  `themeOther.currencyColors`) — always assigned in the same order, never color alone.

## Prerequisites

- Node 18+ · npm 10+
- The backend running (see [`../backend/README.md`](../backend/README.md)) — or a deployed
  backend URL for `VITE_API_BASE_URL`

## Setup & run

```bash
npm install
cp .env.example .env                 # unset = use the Vite dev proxy to localhost:3000
npm run generate:api                 # regenerate src/api/schema.d.ts from ../backend/openapi.json
npm run dev                          # http://localhost:5173
```

`schema.d.ts` is committed (not gitignored) so a fresh clone builds without needing the
backend running first — regenerate it after any backend API change via
`cd ../backend && npm run openapi:export && cd ../frontend && npm run generate:api`.

## Tests

```bash
npm test       # Vitest + Testing Library — 153 tests, mocks the API client, no backend needed
npm run build  # tsc -b && vite build — the same build Vercel runs
```

## Deployment

Deploys to [Vercel](https://vercel.com) as a static site:

1. Import the repo in Vercel, set **Root Directory** to `frontend`.
2. Set the env var `VITE_API_BASE_URL` to the deployed backend's URL including its prefix,
   e.g. `https://tankha-api.onrender.com/api/v1`.
3. Deploy — [`vercel.json`](./vercel.json) rewrites all paths to `index.html` so React
   Router's client-side routes (e.g. `/employees/123`) don't 404 on a direct visit or refresh.

The backend's `CORS_ORIGINS` env var must then be set to this Vercel URL (see
[`../backend/README.md`](../backend/README.md#deployment)) — cross-origin requests are
blocked until it is.
