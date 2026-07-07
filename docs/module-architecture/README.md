# Tankha — Module Architecture

Technical-design documents for each MVP module, derived from
[`../architecture.md`](../architecture.md) (high-level) and tracing to the module PRDs in
[`../module-PRDs/`](../module-PRDs/). Where the PRDs answer *what/why*, these answer
**how it's built** — backend layers, frontend structure, API contracts, and data model.

Each module doc follows Clean Architecture (`domain → application → infrastructure →
interface`) and the shared conventions defined once in [`00-platform.md`](./00-platform.md).

## Documents

| # | Architecture doc | PRD | Covers |
| --- | --- | --- | --- |
| — | [Database Schema](./database-schema.md) | [PRD](../PRD.md) (Section 8) | The one physical data model (Prisma + Postgres) |
| 00 | [Platform](./00-platform.md) | [PRD](../module-PRDs/00-platform.md) | Tenancy, auth plumbing, validation, pagination, errors, OpenAPI |
| 01 | [Access](./01-access.md) | [PRD](../module-PRDs/01-access.md) | Auth + Organisation, JWT, signup/login |
| 02 | [Workforce](./02-workforce.md) | [PRD](../module-PRDs/02-workforce.md) | Employee record, validation, list at 10k, reference data |
| 03 | [Compensation](./03-compensation.md) | [PRD](../module-PRDs/03-compensation.md) | Salary structure, computed total, append-only history |
| 04 | [Data Exchange](./04-data-exchange.md) | [PRD](../module-PRDs/04-data-exchange.md) | Atomic Excel/CSV import + filtered export |
| 05 | [Insights](./05-insights.md) | [PRD](../module-PRDs/05-insights.md) | Read-only per-currency dashboard aggregates |

## Shape of each module doc

1. **Backend** — the four Clean Architecture layers with concrete files/classes.
2. **API contract** — endpoints, request/response JSON, error cases (base `/api/v1`).
3. **Frontend** — the `features/<module>` folder: routes, components, query/mutation hooks.
4. **Traceability** — mapping back to the FR/NFR IDs in [`../PRD.md`](../PRD.md).

## Cross-cutting decisions (read once)

Defined in [`00-platform.md`](./00-platform.md) and assumed by every other doc:

- **Tenant isolation** — every query filtered by `organisationId` at the infrastructure layer.
- **Money** — integer minor units + explicit currency; never summed across currencies (no FX).
- **List convention** — `?page&pageSize&sort&search&filter` → `{ data, total, page, pageSize }`,
  kept in the URL as the TanStack Query key.
- **API contract** — NestJS Swagger/OpenAPI; the frontend client + types are generated from it
  (no hand-written client, no shared package).

## Stack (from [`../architecture.md`](../architecture.md))

NestJS + Prisma + PostgreSQL (backend) · React (Vite) + TanStack Query + react-hook-form +
Mantine (frontend) · TypeScript end-to-end.
