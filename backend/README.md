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
- PostgreSQL 16 (via Docker: `docker compose up -d`)

## Setup & run

```bash
npm install
cp .env.example .env                 # set DATABASE_URL, JWT_SECRET
docker compose up -d                 # local Postgres
npm run prisma:migrate               # create schema
npm run seed                         # global ISO Country/Currency reference data
npm run start:dev                    # http://localhost:3000/api/v1  (docs at /api/v1/docs)
```

The 10,000-employee dataset (NFR-2) is loaded by importing a generated sheet through the
real `data-exchange` import pipeline, not by direct DB population.

## Tests

```bash
npm test          # unit + use-case tests (in-memory fakes, no DB needed) — 94 tests
npm run test:e2e  # boots the app graph with a mocked Prisma; verifies wiring & routes
```

Domain and application layers are tested against in-memory repository fakes, so the suite is
fast and needs no database. Integration tests against real Postgres are a follow-up once a
DB is available.
