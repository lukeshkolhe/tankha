# Module Architecture — Platform (`platform`)

**Status:** Draft v1 · **Scope:** MVP
**Traces to:** [`../architecture.md`](../architecture.md) Sections 4, 5 · [`00-platform PRD`](../module-PRDs/00-platform.md)
**Depends on:** — (foundation for every other module)

This module owns the cross-cutting mechanics decided **once** so no feature module
re-solves (or forgets) them: tenancy, auth plumbing, validation, pagination, errors, and
the OpenAPI contract. Every other architecture doc assumes the conventions defined here.

---

## 1. Backend structure

```
backend/src/platform/
  prisma/
    prisma.service.ts          PrismaService (extends PrismaClient, lifecycle hooks)
  tenancy/
    tenant-context.ts          Request-scoped { userId, organisationId }
    tenant.guard.ts            Populates TenantContext from the validated JWT
  auth/
    jwt.strategy.ts            passport-jwt: verifies token, loads { userId, organisationId }
    jwt-auth.guard.ts          Global guard; @Public() opts routes out (signup/login)
  http/
    pagination.dto.ts          page, pageSize, sort, search + PaginatedResult<T>
    domain-exception.filter.ts Maps typed domain errors → HTTP responses
    money.ts                   Money value object (amountMinor + currencyCode) helpers
  config/
    app-config.ts              @nestjs/config schema (DATABASE_URL, JWT_SECRET, …)
  platform.module.ts           @Global() — exports PrismaService, guards, config
```

`platform.module.ts` is `@Global()` so `PrismaService`, guards, and config are injectable
everywhere without re-importing.

---

## 2. Multi-tenancy (FR-1.3) — the central guarantee

The one invariant of the whole product: **no query ever crosses an organisation boundary.**

1. The JWT carries `{ sub: userId, organisationId }`.
2. `JwtAuthGuard` (global) validates the token; `TenantGuard` copies `organisationId` into
   a **request-scoped** `TenantContext`.
3. Every Prisma repository adapter reads `organisationId` from `TenantContext` and adds it
   to `where` — enforced in the **infrastructure layer** so no use case can forget it.

```ts
// every repository adapter follows this shape
findMany(query) {
  return this.prisma.employee.findMany({
    where: { organisationId: this.tenant.organisationId, ...query.filters },
  });
}
```

Repositories never accept `organisationId` as a caller-supplied argument — it comes only
from `TenantContext`, so a controller can't spoof it. This is asserted by an e2e test that
signs in as org A and confirms org B's data is unreachable on every route.

---

## 3. Authentication plumbing (owned with `access`)

- `@nestjs/jwt` + `passport-jwt` strategy; `argon2` for password hashing.
- `JwtAuthGuard` is registered globally via `APP_GUARD`. Public routes (`/auth/signup`,
  `/auth/login`) are marked with a `@Public()` decorator.
- Token: signed JWT, `HS256`, 24h expiry, secret from config. No refresh rotation in MVP
  (see PRD out-of-scope).

The `access` module owns the *use cases* (signup/login); `platform` owns the *guards and
strategy* they plug into. See [`01-access.md`](./01-access.md).

---

## 4. Validation (one rule set, two entry points)

- **Transport validation** (shape/type) lives on interface DTOs via `class-validator` +
  a global `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`).
- **Domain validation** (business rules) lives in the domain layer as a reusable
  `EmployeeValidation` rule set (in `workforce/domain`), consumed by **both** manual entry
  and the importer — one source of truth (see [`04-data-exchange.md`](./04-data-exchange.md)).

Frontend forms use `zod` schemas whose shape mirrors the generated request DTOs.

---

## 5. Pagination / search / filter convention

Every list endpoint speaks the same dialect.

**Request** (query string):

```
?page=1&pageSize=25&sort=lastName:asc&search=priya&department=<id>&country=IN&status=ACTIVE
```

| Param | Rule |
| --- | --- |
| `page` | 1-based; default 1 |
| `pageSize` | default 25, max 100 |
| `sort` | `field:asc\|desc`; whitelisted fields only |
| `search` | case-insensitive `contains` on name + employeeCode |
| filters | module-specific whitelisted fields |

**Response** envelope:

```json
{ "data": [ /* … */ ], "total": 10000, "page": 1, "pageSize": 25 }
```

The frontend keeps these params in the **URL** (React Router search params) so they double
as the TanStack Query key — refresh-safe and shareable (see [`02-workforce.md`](./02-workforce.md)).

---

## 6. Error handling

Typed domain errors extend a `DomainError` base; a global `DomainExceptionFilter` maps
them to HTTP without leaking internals.

| Domain error | HTTP | `error` code |
| --- | --- | --- |
| `ValidationError` | 400 | `VALIDATION_ERROR` |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` |
| `TenantForbiddenError` | 403 | `FORBIDDEN` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `DuplicateError` (e.g. employeeCode, email) | 409 | `CONFLICT` |

**Standard error body** (used by every module):

```json
{
  "statusCode": 409,
  "error": "CONFLICT",
  "message": "Employee code EMP-1001 already exists in this organisation.",
  "details": [ { "field": "employeeCode", "reason": "duplicate" } ]
}
```

`details` is optional and used for field-level validation feedback consumed by frontend forms.

---

## 7. Money value object

A tiny domain primitive reused everywhere money appears:

```ts
type Money = { amountMinor: number; currencyCode: string };
// add(a, b): asserts same currency, else throws — no cross-currency arithmetic ever.
```

This is what mechanically guarantees "no screen sums across currencies" (NFR-3): the type
refuses to add two different currencies, so [`05-insights.md`](./05-insights.md) is forced
to group by currency.

---

## 8. API contract generation

- NestJS **Swagger** decorators produce `/api/v1/docs` + `openapi.json`.
- The frontend generates its typed client and TanStack Query hooks from `openapi.json`
  (e.g. `openapi-typescript` + a codegen script) — **no hand-written client, no shared
  package**. This is the single mechanism giving end-to-end type safety across the two
  independently-deployed modules.

Global API conventions: prefix `**/api/v1**`, JSON, `Authorization: Bearer <jwt>`.

---

## 9. Traceability

| Concern | Realised by |
| --- | --- |
| FR-1.3 tenant isolation | `TenantGuard` + `TenantContext` + infra-layer filtering |
| NFR-1 scale | Pagination convention + DB indexes ([`database-schema.md`](./database-schema.md)) |
| NFR-3 multi-currency | `Money` value object (no cross-currency add) |
| NFR-4 integrity | `PrismaService.$transaction` used by every multi-write use case |
| NFR-5 auditability | `createdAt`/`updatedAt` + `changedByUserId` on revisions |
| API contract | Swagger/OpenAPI → generated FE client |
