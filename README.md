# Tankha — Salary Management System

A web-based system of record for salary data — replacing ACME HR's spreadsheets with a
single validated, queryable source of truth. Built for **one persona: the HR Manager**,
who onboards their org, manages ~10,000 employees' salary data across countries and
currencies, and answers "how do we pay people?" from a dashboard instead of a pivot table.

---

## 🚀 Quick Start

**Prerequisites:** Node 18+, npm 10+, PostgreSQL 16 (local install or Docker).

```bash
git clone git@github.com:lukeshkolhe/tankha.git
cd tankha

# Backend
cd backend
npm install
cp .env.example .env             # set DATABASE_URL, DIRECT_DATABASE_URL, JWT_SECRET
docker compose up -d             # local Postgres
npm run prisma:migrate
npm run seed                     # ISO country/currency reference data
npm run start:dev                # http://localhost:3000/api/v1  (docs at /api/v1/docs)

# Frontend (separate terminal)
cd ../frontend
npm install
cp .env.example .env             # unset = proxies to localhost:3000 in dev
npm run generate:api             # generate typed client from ../backend/openapi.json
npm run dev                      # http://localhost:5173
```

To demo at 10k-employee scale (NFR-2), see `[backend/README.md](./backend/README.md#demonstrating-scale-nfr-2)`
— it's loaded through the real import pipeline, not written to the DB directly.

**Running:**

- Local: frontend at `http://localhost:5173`, API at `http://localhost:3000/api/v1`
- Deployed: frontend at [tankha.vercel.app](https://tankha.vercel.app), API at
[tankha-api.onrender.com](https://tankha-api.onrender.com/api/v1/docs) (Render free tier —
the API can take ~30–60s to wake up on first request after idling)

---

## 📋 Requirements Document

Full PRD: `[docs/PRD.md](./docs/PRD.md)` · problem statement: `[docs/WHY-TANKHA.md](./docs/WHY-TANKHA.md)`
· per-module PRDs: `[docs/module-PRDs/](./docs/module-PRDs/)`

**Goal:** give HR one trustworthy, validated source of salary data for 10,000+ employees,
make it easy to answer questions about how the org pays people, preserve a full audit
history of salary changes, and bridge smoothly from the existing Excel workflow.

**Explicitly out of scope (MVP)** — see `[docs/PRD.md](./docs/PRD.md)`
for the full table with reasons:

- **Payroll operations** (tax/net-pay calculation, payslips, Full & Final settlement) —
the product optimizes for *understanding* compensation, not *running* payroll.
- **FX conversion between currencies** — amounts stay per-currency; live FX adds
complexity without new value for this use case.
- **Employee self-service & role-based access control** — single HR persona per org;
no employee logins or permission matrix in the MVP.
- **Enterprise integrations, mobile apps, compliance certifications** — no external
systems in the assignment context.

---

## 🏗️ Architecture

Full design of record: `[docs/architecture.md](./docs/architecture.md)` (high-level) and
`[docs/module-architecture/](./docs/module-architecture/)` (per-module, with the
database schema).

**Stack**


| Layer         | Choice                    | Why                                                                                                                                                             |
| ------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend       | **NestJS** (TypeScript)   | Modules, DI, guards, and pipes map directly onto bounded contexts and cross-cutting concerns (tenancy, validation) without hand-rolling them.                   |
| ORM / DB      | **Prisma + PostgreSQL**   | Type-safe queries, migrations, and real transactions — Postgres handles 10k+ rows and concurrent writes; SQLite wouldn't demonstrate the same scale story.      |
| Frontend      | **React (Vite) SPA**      | Fast dev/build for a single, focused dashboard app — no need for Next.js's SSR/routing since there's one persona and no SEO surface.                            |
| UI components | **Mantine**               | Batteries-included tables, forms, and layout for a data-dense HR dashboard — avoids hand-building a design system for an assignment-scoped app.                 |
| Server state  | **TanStack Query**        | Caching, pagination, and cache invalidation for employee/dashboard data out of the box.                                                                         |
| Language      | **TypeScript end-to-end** | The frontend's API client & types are generated from the backend's OpenAPI contract — one source of truth for the API shape, no shared package to keep in sync. |


**High-level topology**

```
┌────────────────────┐        HTTPS / JSON        ┌────────────────────────┐
│   React SPA (Vite) │  ───────────────────────▶  │   NestJS API           │
│  - TanStack Query  │  ◀───────────────────────  │  - Auth (JWT)          │
│  - React Router    │                            │  - Bounded-context     │
│  - react-hook-form │                            │    modules             │
└────────────────────┘                            │  - Prisma              │
                                                   └───────────┬────────────┘
                                                               │ SQL
                                                     ┌─────────▼─────────┐
                                                     │   PostgreSQL       │
                                                     └────────────────────┘
```

Two deployables — the API (Render) and the static SPA (Vercel) — plus one shared
Postgres (Neon). The backend is split into six **bounded contexts**, each following
Clean Architecture (`domain → application → infrastructure → interface`) so business
rules stay independent of NestJS and Prisma:


| Context         | Owns                                                                           |
| --------------- | ------------------------------------------------------------------------------ |
| `platform`      | Prisma, request-scoped tenancy, auth guards, `Money`, pagination, `UnitOfWork` |
| `access`        | HR user, Organisation, signup/login (JWT + argon2)                             |
| `workforce`     | Employee record, validation, 10k-scale list, reference data                    |
| `compensation`  | Salary structure, computed total, append-only revision history                 |
| `data-exchange` | Two-phase (preview → commit) Excel/CSV import, filtered export                 |
| `insights`      | Read-only per-currency dashboard aggregates                                    |


**Key design decisions**

- **Multi-tenancy** — a JWT carries `userId` + `organisationId`; a `TenantGuard`
populates a request-scoped `TenantContext`, and every repository filters by
`organisationId` at the infrastructure layer — so no use case can accidentally leak
data across orgs.
- **Multi-currency without FX** — each employee carries a country and currency; money
is stored as **integer minor units + an explicit currency code** (never floats), and
the `Money` value object refuses cross-currency addition — no screen can silently sum
₹ and $.
- **Audit trail** — every salary edit produces an append-only `SalaryRevision`
(timestamp, old → new total, remark). This one entity also serves as the appraisal
record, so there's no separate appraisal workflow to build.
- **Atomic bulk import** — the importer is a **two-phase preview → commit** pipeline:
it validates every row first (with per-row override support for confirmed conflicts),
then commits all valid rows inside a single Prisma `$transaction`, returning an
`ImportReport` of inserted vs. rejected rows. A bad paste can't corrupt part of the
dataset — it's all or a clearly reported nothing.
- **Cross-module transactions** — writes that span two contexts (e.g. creating an
employee also creates their initial salary structure) run through an ambient
`UnitOfWork` (`AsyncLocalStorage`), so the `workforce → compensation` edge stays
transactional without either module reaching into the other's repository.

---

## ✨ Features

- **Sign up and create an organisation** — email/password auth; all data is scoped to
the HR Manager's org.
- **Manage employees** — create, view, edit, and deactivate; name, unique employee ID,
department, designation, country, currency, join date, status — all validated
(required fields, unique ID, non-negative salary).
- **Search, filter, and paginate** the employee list at 10,000-row scale (server-side).
- **Structured salary** — a configurable set of components (e.g. Basic, Allowances)
with an automatically computed total, in the employee's own currency.
- **Edit salary with a remark** — every change is logged with a timestamp, old → new
value, and the reason, forming a full revision history / appraisal record.
- **Bulk import** employees & salaries from Excel/CSV — preview first, fix or override
flagged rows, then commit atomically; get an error report for anything rejected.
- **Export** the current (optionally filtered) dataset back to Excel/CSV.
- **Dashboard** — headcount, total & average compensation, and breakdowns by
department and by country, per currency.

---

## 🧪 Testing

**Backend** (`backend/`) — 3 tiers, run independently:

```bash
npm test            # unit + use-case tests — in-memory repo fakes, no DB — 95 tests
npm run test:e2e     # boots the app graph with a mocked Prisma — verifies wiring/routes
npm run test:e2e:db  # real NestJS app + real Prisma + real Postgres, via supertest
```

Coverage focuses on **domain logic, not CRUD plumbing**: validation rules, salary-total
computation and revision creation, tenant isolation across two organisations, the
import preview → commit flow (including per-row override on a confirmed conflict), and
the cross-module create-employee transaction. `test:e2e:db` is the one tier that talks
to a real database, kept in its own Jest config precisely so the other two tiers stay
fast and DB-free. It's also what caught two real bugs: a Proxy `this`-binding issue in
`PrismaService` (fixed by composition over inheritance) and a 5s Prisma
interactive-transaction timeout too short for a 10k-row bulk commit.

**Frontend** (`frontend/`) — 153 tests via Vitest + Testing Library, mocking the API
client (no backend needed):

```bash
npm test
```

**Deliberate gaps:** no exhaustive UI snapshot/visual-regression coverage, and no load
testing beyond the manual 10k-import timing check documented in
`[backend/README.md](./backend/README.md#demonstrating-scale-nfr-2)` — both are more
than the assignment's "core logic, not CRUD" bar calls for.

---

## 🤖 AI Usage

This project was built with **Claude Code** end-to-end — discovery questions, PRD,
architecture docs, and both the NestJS backend and React frontend were scaffolded and
implemented in Claude Code sessions, with tests written alongside the code (TDD against
in-memory fakes on the backend).

Where I overrode or steered it:

- **Import design** — the first pass at the import feature was a simpler single-phase
commit. I had it redesigned into the current two-phase preview → commit flow with
per-row override, because a one-shot import gives HR no chance to fix a bad row
before 10,000 records land in the database.
- **Code review before treating docs as final** — ran a code-review pass over the
module-architecture docs and addressed the findings (commit `e61d9ae`) rather than
accepting the first draft as the design of record.
- **Scope discipline** — the discovery/requirements docs (`docs/dump/`) started from a
much larger payroll-system brief (taxes, payslips, FnF settlement, bank disbursement,
RBAC). I reviewed and cut that down to the MVP in [PRD §7](./docs/PRD.md#7-dropped--out-of-scope-requirements-mvp), keeping the system
focused on *understanding* compensation rather than *running* payroll — that scoping
call was mine, not the model's default.
- **Docs and naming** — I asked for domain-specific naming (`SalaryRevision`,
`TenantContext`) over generic `utils`/`helpers`, and reviewed the module-architecture
docs for consistency before treating them as the design of record.
- **Specialized skills for specific tasks** — rather than one generic pass, I used
purpose-built skills for each phase: a **product-manager** skill for the discovery
questions and PRD, a **software-architect** skill for the high-level and per-module
architecture docs, a **SOLID/software-engineer** skill for the Clean Architecture
backend implementation, and a **designer** skill for the frontend's UI/dashboard
decisions — each reviewed against the artifact it was actually meant to produce.

---

## ⚖️ Trade-offs & What I Left Out

- **No payroll engine** (tax/net-pay calculation, payslips, Full & Final settlement) —
each is a large per-country rabbit hole, and none of it is needed to *understand* how
the org pays people, which is the stated goal.
- **No FX conversion** — every figure stays in its own currency; converting to one
reporting currency needs a rate source and a point-in-time policy that adds real
complexity for a dashboard that's explicitly per-currency.
- **No employee self-service or RBAC** — one HR persona per org in the MVP, so a
permission matrix would be speculative complexity with no second role to test it
against.
- **No enterprise integrations, mobile app, or compliance certifications** — outside
what an assignment-scoped, single-tenant-per-org demo needs to prove.
- **No appraisal workflow** — the salary-revision history (timestamp, old → new,
remark) already serves as the appraisal record; a separate review/approval cycle
would be duplicate machinery.

---

## 📈 If I Had More Time

- **Role-based access** so a second persona (e.g. a read-only Finance viewer) could
exist without every employee's data being fully open to one HR login.
- **Effective-dated salary structures** (not just point-in-time edits) to support
scheduling a raise ahead of its effective date rather than applying it same-day.
- **Saved/scheduled exports** and richer dashboard breakdowns (e.g. year-over-year
comp growth, pay-band outliers) — the discovery notes in
`[docs/dump/1_discovery-questions.md](./docs/dump/1_discovery-questions.md)` flagged
several of these as open questions that didn't make the MVP cut.
- **Visual regression tests** for the Mantine-based dashboard, and a load test beyond
the manual 10k-import timing check.

