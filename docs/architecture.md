# Tankha — High-Level Architecture

**Status:** Draft v1 · **Scope:** MVP · **Source of truth:** `[PRD.md](./PRD.md)`

Guiding principles (from our engineering standards):

- **Clean Architecture** — domain logic is independent of frameworks, DB, and UI.
- **Domain-Driven Design** — the system is split into **bounded contexts** that mirror
the PRD modules, each with a clear, single purpose and ubiquitous language.
- **Library-first** — prefer proven libraries over custom code (auth, validation,
ORM, parsing). Custom code is reserved for Tankha's own domain rules.
- **Domain-specific naming** — no `utils`/`helpers`/`common` dumping grounds; names
describe intent (`EmployeeImporter`, `SalaryRevisionService`, `PayInsightQuery`).

---

## 1. Stack


| Layer            | Choice                    | Why                                                                                                                                                    |
| ---------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Backend**      | **NestJS** (TypeScript)   | First-class modules, DI, guards, and pipes map directly onto our bounded contexts and cross-cutting concerns.                                          |
| **ORM / DB**     | **Prisma + PostgreSQL**   | Type-safe queries, migrations, transactions; Postgres handles 10k+ rows, real indexes, and concurrency.                                                |
| **Frontend**     | **React (Vite) SPA**      | Fast dev/build; a focused single-page app for the HR persona.                                                                                          |
| **Server state** | **TanStack Query**        | Caching, pagination, and background refetch for the employee/dashboard data.                                                                           |
| **Language**     | **TypeScript** end-to-end | One language for both modules; the frontend's API types are generated from the backend's OpenAPI contract (single source of truth, no shared package). |


---

## 2. System topology

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

Two deployables: the **API** and the **static SPA**. A **seed script** populates
Postgres with 10,000 employees for demos and load realism.

**Repository structure** — a single git repo (`tankha`) with two independent modules,
each with its **own `package.json`** (built, run, and deployed separately):

```
tankha/                  ← single git repo
├── backend/             ← NestJS API   (own package.json)
├── frontend/            ← React (Vite)  (own package.json)
└── docs/                ← PRD, architecture, etc.
```

No monorepo workspace tooling — the two modules are decoupled. Type safety across the
boundary comes from the **frontend generating its API client & types from the backend's
OpenAPI spec**, so there's no shared package to maintain.

---

## 3. Bounded contexts (backend modules)

Each context is a NestJS module that owns its domain, use cases, and persistence.
They map 1:1 to PRD Section 4.


| Context (module)    | Owns                                                                           | PRD module                    |
| ------------------- | ------------------------------------------------------------------------------ | ----------------------------- |
| `**access`**        | HR user, Organisation, authentication, tenant scoping                          | Authentication & Organisation |
| `**workforce**`     | Employee entity, attributes, lifecycle, listing                                | Employee Management           |
| `**compensation**`  | SalaryStructure, SalaryComponent, **SalaryRevision** (change history)          | Salary & Compensation         |
| `**data-exchange`** | Excel/CSV import pipeline & export                                             | Data Import & Export          |
| `**insights**`      | Aggregations for the dashboard ("how the org pays people")                     | Dashboard & Analytics         |
| `**platform**`      | Infrastructure shared by all: `PrismaService`, `TenantContext`, guards, config | Platform / Non-functional     |


**Ubiquitous language:** *Organisation, Employee, SalaryStructure, SalaryComponent,
SalaryRevision (an edit with old→new + remark), PayInsight.*

---

## 4. Layering inside a context (Clean Architecture)

Every context follows the same four layers, so business logic stays free of NestJS
and Prisma:

```
workforce/
  domain/          Entities, value objects, domain services, repository PORTS (interfaces)
  application/     Use cases (commands/queries), DTOs — orchestrate the domain
  infrastructure/  Prisma repository ADAPTERS, external libs (exceljs) — implement ports
  interface/       NestJS controllers + request/response DTOs (validation lives here)
  workforce.module.ts
```

- **Dependency rule:** `interface → application → domain`; `infrastructure` implements
`domain` ports. The domain layer imports nothing framework-specific → **pure, fast to unit-test**.
- Repository **ports** (interfaces) are defined in `domain`; Prisma implementations in
`infrastructure` are bound via DI — the domain never sees Prisma.

---

## 5. Cross-cutting concerns (decided once, in `platform`)


| Concern                          | Approach                                                                                                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multi-tenancy**                | JWT carries `userId` + `organisationId`. A `TenantGuard` populates a request-scoped `TenantContext`; **every repository query filters by `organisationId`** — enforced at the infrastructure layer so no use case can forget it. |
| **Authentication**               | `@nestjs/jwt` + Passport JWT strategy; passwords hashed with **argon2**. Email/password signup & login.                                                                                                                          |
| **Validation**                   | `class-validator` + Nest `ValidationPipe` on interface DTOs. A single `**EmployeeValidation`** domain rule set is reused by both manual entry and the importer — one source of truth, no duplication.                            |
| **Pagination / search / filter** | One convention: `?page&pageSize&sort&filter`; responses `{ data, total, page, pageSize }`. Backed by DB indexes to meet the 10k-scale bar.                                                                                       |
| **Atomic import**                | The importer validates all rows, then commits valid ones inside a **Prisma `$transaction`**, returning an `ImportReport { inserted, failed[] }`.                                                                                 |
| **Error handling**               | Typed domain errors mapped to HTTP by a Nest exception filter; no leaking of internals.                                                                                                                                          |
| **API contract**                 | NestJS **Swagger/OpenAPI**; the frontend client & types are generated from it (library-first, no hand-written client).                                                                                                           |


---

## 6. Data model (Prisma sketch)

```
Organisation 1─* User            (HR account owns the org)
Organisation 1─* Employee
Employee     1─1 SalaryStructure
SalaryStructure 1─* SalaryComponent   (Basic, Allowances, … each with amount)
Employee     1─* SalaryRevision        (timestamp, oldTotal, newTotal, remark)
Reference:   Department, Designation, Country, Currency
```

- `Employee` holds `organisationId`, unique `(organisationId, employeeCode)`, country,
currency, department, designation, joinDate, status.
- `**SalaryRevision**` is the append-only history that satisfies FR-3.3 and doubles as
the appraisal record — no separate appraisal entity.
- Money stored as integer **minor units + currency code** (never floats); no FX.

---

## 7. Frontend architecture

- **Feature-based folders** mirroring the backend contexts (`features/employees`,
`features/compensation`, `features/insights`, `features/auth`) — not layer-based.
- **Server state** via TanStack Query (lists, pagination, mutations, cache invalidation).
- **Forms** via `react-hook-form` + **zod** schemas (shared shape with API DTOs).
- **Routing** via React Router; auth-guarded routes.
- **Component library:** **Mantine** — batteries-included tables, forms, and layout,
strong for a data-dense dashboard (avoids hand-building a design system).
- **Data grid:** Mantine/TanStack Table with **server-side** pagination for 10k rows.
- **API client + types generated** from the backend OpenAPI spec.

```
src/
  app/           router, providers (QueryClient, theme)
  features/
    auth/        login, signup, org creation
    employees/   list (server-paginated), detail, create/edit
    compensation/ salary edit + revision history timeline
    insights/    dashboard (breakdowns by department & country)
  api/           generated client + query hooks
```

**State-management strategy** — TanStack Query owns *server* state; the remaining
*client* state is small and split by category (no Redux / global store):


| Category                                | Tool                                           | Tankha examples                                                                                                                  |
| --------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Server state**                        | **TanStack Query**                             | Employee list, salary history, dashboard aggregates                                                                              |
| **List page / filters / sort / search** | **URL** (React Router search params)           | `/employees?page=2&department=Eng&sort=salary` — doubles as the TanStack Query key, so changing the URL refetches the right data |
| **Form state**                          | **react-hook-form + zod**                      | Add/edit employee, salary-edit form with remark                                                                                  |
| **Ephemeral UI state**                  | React `useState` / `useReducer`                | Modals, dropdowns, toggles                                                                                                       |
| **Global app state**                    | **React Context** (→ Zustand only if it grows) | Current HR user / session, theme                                                                                                 |


Rationale: putting pagination/filters in the **URL** (not a store) makes them
refresh-safe, shareable, and automatically in sync with server queries — removing most
of what a global store is usually reached for. Auth/session is the one genuinely global
piece, held in a small `AuthContext`.

---

## 8. Key libraries (library-first)


| Need              | Library                                            | Not custom because                         |
| ----------------- | -------------------------------------------------- | ------------------------------------------ |
| Auth              | `@nestjs/jwt`, `passport-jwt`, `argon2`            | Security-sensitive; use vetted primitives. |
| Validation / DTOs | `class-validator`, `class-transformer`, `zod` (FE) | Declarative, battle-tested.                |
| ORM / migrations  | `prisma`                                           | Type-safe, transactional.                  |
| Excel / CSV       | `exceljs`, `fast-csv`                              | Parsing edge cases are a solved problem.   |
| Seed data         | `@faker-js/faker`                                  | Realistic 10k dataset quickly.             |
| Server state (FE) | `@tanstack/react-query`                            | Caching/pagination out of the box.         |
| Forms (FE)        | `react-hook-form`                                  | Performant, minimal re-renders.            |
| UI                | `@mantine/core`, `@mantine/hooks`                  | Full component set for the dashboard.      |
| Tests             | `jest` (BE), `vitest` + Testing Library (FE)       | Fast, deterministic.                       |


---

## 9. Testing strategy

- **Domain layer:** pure unit tests (no I/O) — validation rules, salary-total
computation, revision creation. Fast and deterministic.
- **Use cases:** tested against **in-memory repository fakes** (the ports make this trivial).
- **Interface:** a thin set of controller/e2e tests for the critical flows (auth,
create employee, edit salary, import).
- Focus coverage on core functionality per the assignment, not exhaustive breadth.

---

## 10. Running & deployment

- **Local:** `docker compose up` (Postgres) → `prisma migrate` → `npm run seed` (10k) →
API + Vite dev server.
- **Deploy:** API and SPA as two services (e.g. Render/Fly for API + Postgres, static
host for the SPA). Env-driven config via `@nestjs/config`.

---

## 11. Traceability to PRD


| PRD area                                 | Realised by                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| FR-1.x (auth, org, tenancy)              | `access` module + `TenantGuard`/`TenantContext`                          |
| FR-2.x (employees, validation, listing)  | `workforce` module + shared `EmployeeValidation` + pagination convention |
| FR-3.x (salary structure, edit, history) | `compensation` module + `SalaryRevision`                                 |
| FR-4.x (import/export)                   | `data-exchange` module + atomic import pipeline                          |
| FR-5.x (dashboard)                       | `insights` module + FE `features/insights`                               |
| NFR-1/-4 (scale, integrity)              | Postgres + indexes + `$transaction` + server-side pagination             |
| NFR-3 (multi-currency)                   | minor-units + currency code, no FX                                       |


---

