# Tankha Backend

NestJS + Prisma + PostgreSQL API for Tankha. Built with **Clean Architecture** — six
bounded contexts that map 1:1 to the PRD modules, each layered
`domain → application → infrastructure → interface`. See
[`../docs/module-architecture/`](../docs/module-architecture/) for the design of record.

## Bounded contexts (`src/`)

| Module          | Owns                                                              |
| --------------- | ---------------------------------------------------------------- |
| `platform`      | Prisma, tenancy, auth guards, `Money`, pagination, errors, `UnitOfWork` |
| `access`        | HR user, Organisation, signup/login/session (JWT + argon2)       |
| `workforce`     | Employee record, validation, 10k-scale list, reference data      |
| `compensation`  | Salary structure, computed total, append-only revision history   |
| `data-exchange` | Two-phase (preview→commit) Excel/CSV import, filtered export      |
| `insights`      | Read-only per-currency dashboard aggregates                      |

### Key conventions

- **Tenancy** — every repository filters by `organisationId` from the request-scoped
  `TenantContext`; it is never a caller argument.
- **Transactions** — multi-write and cross-module flows run in an ambient `UnitOfWork`
  (AsyncLocalStorage); adapters read/write through `prisma.activeClient` so they join it.
  Create-employee writes the Employee and its initial salary in one transaction across the
  `workforce → compensation` edge.
- **Money** — integer minor units + explicit currency; the `Money` VO refuses cross-currency
  addition, so no screen ever sums across currencies.

## Prerequisites

- Node 18+ · npm 10+
- PostgreSQL 16 — via Docker (`docker compose up -d`) or a local install
  (`brew install postgresql@16`, then `pg_ctl -D <datadir> start` or `brew services start postgresql@16`)

## Setup & run

```bash
npm install
cp .env.example .env                 # set DATABASE_URL, JWT_SECRET
docker compose up -d                 # local Postgres (or start your own instance)
npm run prisma:migrate               # create schema
npm run seed                         # global ISO Country/Currency reference data
npm run start:dev                    # http://localhost:3000/api/v1  (docs at /api/v1/docs)
```

### Demonstrating scale (NFR-2)

The 10,000-employee dataset is loaded by importing a generated sheet through the real
`data-exchange` import pipeline — never by writing rows to the DB directly:

```bash
npm run seed:generate-10k            # writes seed-data/tankha-10k.csv (gitignored, regenerate anytime)
npm run start:dev                    # in one terminal
npm run seed:import-10k              # in another: signs up a demo org, previews, commits, times reads
```

Measured on a local Postgres@16 instance: preview ~120ms, commit (10k rows, one `$transaction`)
~6s, and `GET /employees` / `/insights/*` all respond in under 40ms afterwards — comfortably
inside the < 1s bar (NFR-1).

## Tests

```bash
npm test          # unit + use-case tests (in-memory fakes, no DB needed) — 95 tests
npm run test:e2e  # boots the app graph with a mocked Prisma; verifies wiring & routes
```

Domain and application layers are tested against in-memory repository fakes, so the suite is
fast and needs no database. The scripts above exercise the real Prisma/Postgres path — two
bugs (a Proxy `this`-binding issue in `PrismaService`, and a 5s Prisma interactive-transaction
timeout too short for a 10k bulk commit) were only found this way and are fixed in
`src/platform/prisma/prisma.service.ts`.
