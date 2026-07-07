# Tankha — Database Schema (Prisma + PostgreSQL)

**Status:** Draft v1 · **Scope:** MVP · **Source of truth for the DB.**
**Traces to:** [`../architecture.md`](../architecture.md) Section 6, [`../PRD.md`](../PRD.md) Section 8.

This is the **one** place the physical data model is defined. Every module-architecture
doc references entities here rather than redefining them. The Prisma schema below is the
single source of truth; `prisma migrate` derives the SQL, and the NestJS
`infrastructure` layers map their domain entities onto these models.

---

## 1. Design rules

- **Money = integer minor units + explicit currency code.** No floats, ever. A value is
  `amountMinor: Int` paired with a `currencyCode`. Display formatting uses
  `Currency.minorUnitDigits` (e.g. `250000` INR + 2 digits → ₹2,500.00). No FX.
- **Every row is tenant-scoped.** Every business table carries `organisationId`. The
  `platform` layer enforces that *every* query filters by it (see
  [`00-platform.md`](./00-platform.md)); `organisationId` is denormalised onto child
  tables (`SalaryStructure`, `SalaryRevision`) so tenant filtering never needs a join.
- **Identifiers are `cuid`** (collision-resistant, URL-safe, non-guessable) except the
  global ISO reference tables, which are keyed by their natural ISO code.
- **Reference data split:** `Department`/`Designation` are **per-organisation** (seeded on
  org creation, HR-editable later). `Country`/`Currency` are **global static** ISO tables.
- **History is append-only.** `SalaryRevision` rows are inserted, never updated or deleted.
- **Timestamps everywhere** (`createdAt`, `updatedAt`) as the raw material for auditability.

---

## 2. Entity-relationship overview

```
Organisation 1─* User                (HR account owns the org)
Organisation 1─* Employee
Organisation 1─* Department           (per-org reference)
Organisation 1─* Designation          (per-org reference)

Employee     *─1 Department
Employee     *─1 Designation
Employee     *─1 Country              (global ISO)
Employee     *─1 Currency             (global ISO)
Employee     1─1 SalaryStructure
Employee     1─* SalaryRevision       (append-only history / appraisal record)

SalaryStructure 1─* SalaryComponent   (fixed component set, each with amountMinor)
SalaryRevision  *─1 User              (changedBy — attributable)
```

---

## 3. Prisma schema

```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────── access ───────────────────────────

model Organisation {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users        User[]
  employees    Employee[]
  departments  Department[]
  designations Designation[]
}

model User {
  id             String       @id @default(cuid())
  organisationId String
  organisation   Organisation @relation(fields: [organisationId], references: [id])
  email          String       @unique          // globally unique login
  name           String
  passwordHash   String                          // argon2
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  salaryRevisions SalaryRevision[] // changes this user made

  @@index([organisationId])
}

// ─────────────────────────── workforce ───────────────────────────

enum EmployeeStatus {
  ACTIVE
  INACTIVE
}

model Employee {
  id             String         @id @default(cuid())
  organisationId String
  organisation   Organisation   @relation(fields: [organisationId], references: [id])
  employeeCode   String                          // HR-facing unique ID, per org
  firstName      String
  lastName       String
  departmentId   String
  department     Department     @relation(fields: [departmentId], references: [id])
  designationId  String
  designation    Designation    @relation(fields: [designationId], references: [id])
  countryCode    String                          // ISO 3166-1 alpha-2
  country        Country        @relation(fields: [countryCode], references: [code])
  currencyCode   String                          // ISO 4217
  currency       Currency       @relation(fields: [currencyCode], references: [code])
  joinDate       DateTime       @db.Date
  status         EmployeeStatus @default(ACTIVE)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  salaryStructure SalaryStructure?
  salaryRevisions SalaryRevision[]

  @@unique([organisationId, employeeCode])       // FR-2.2 uniqueness
  @@index([organisationId, status])              // list default filter
  @@index([organisationId, departmentId])        // filter + breakdowns
  @@index([organisationId, countryCode])         // filter + breakdowns
  @@index([organisationId, lastName, firstName]) // name sort/search
}

// ─────────────────────────── compensation ───────────────────────────

enum SalaryComponentType {
  BASIC
  HOUSE_RENT_ALLOWANCE
  SPECIAL_ALLOWANCE
  TRANSPORT_ALLOWANCE
  ANNUAL_BONUS          // flat annualised bonus amount; structured/variable bonus is out of scope
}

model SalaryStructure {
  id             String   @id @default(cuid())
  employeeId     String   @unique               // 1:1 with Employee
  employee       Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  organisationId String                          // denormalised for tenant filter
  currencyCode   String                          // mirrors employee currency
  totalMinor     Int                             // cached sum of components (recomputed on write)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  components SalaryComponent[]

  @@index([organisationId, currencyCode])        // insights aggregation
}

model SalaryComponent {
  id                String              @id @default(cuid())
  salaryStructureId String
  salaryStructure   SalaryStructure     @relation(fields: [salaryStructureId], references: [id], onDelete: Cascade)
  type              SalaryComponentType
  amountMinor       Int                             // >= 0, enforced in domain

  @@unique([salaryStructureId, type])            // one row per component type
}

model SalaryRevision {
  id             String   @id @default(cuid())
  employeeId     String
  employee       Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  organisationId String                          // denormalised for tenant filter
  currencyCode   String
  oldTotalMinor  Int?                             // null on initial creation
  newTotalMinor  Int
  componentsSnapshot Json                         // component breakdown at this revision
  remark         String                           // required on edits (FR-3.3)
  changedByUserId String
  changedBy      User     @relation(fields: [changedByUserId], references: [id])
  createdAt      DateTime @default(now())          // the change timestamp

  @@index([employeeId, createdAt(sort: Desc)])   // newest-first timeline
  @@index([organisationId])
}

// ─────────────────────────── reference data ───────────────────────────

model Department {
  id             String       @id @default(cuid())
  organisationId String
  organisation   Organisation @relation(fields: [organisationId], references: [id])
  name           String
  employees      Employee[]

  @@unique([organisationId, name])
}

model Designation {
  id             String       @id @default(cuid())
  organisationId String
  organisation   Organisation @relation(fields: [organisationId], references: [id])
  name           String
  employees      Employee[]

  @@unique([organisationId, name])
}

model Country {
  code      String     @id                        // ISO 3166-1 alpha-2, e.g. "IN"
  name      String
  employees Employee[]
}

model Currency {
  code            String     @id                   // ISO 4217, e.g. "INR"
  name            String
  symbol          String                            // e.g. "₹"
  minorUnitDigits Int                               // 2 for INR/USD, 0 for JPY
  employees       Employee[]
}
```

---

## 4. Key indexing & performance notes (NFR-1, 10k scale)

| Query | Index that serves it |
| --- | --- |
| Employee list, default (active, paged, name sort) | `@@index([organisationId, status])` + `([organisationId, lastName, firstName])` |
| Filter by department / country | `([organisationId, departmentId])`, `([organisationId, countryCode])` |
| Salary history timeline | `([employeeId, createdAt Desc])` |
| Dashboard aggregates grouped by currency | `SalaryStructure([organisationId, currencyCode])` |
| Uniqueness enforcement | `Employee @@unique([organisationId, employeeCode])` |

Search by name/code uses a case-insensitive `contains`; if it becomes a bottleneck at 10k
the fast-follow is a Postgres `pg_trgm` GIN index (out of MVP scope, flagged in
[`02-workforce.md`](./02-workforce.md)).

## 5. Transactional integrity (NFR-4)

- **Employee create** = insert `Employee` + `SalaryStructure` + `SalaryComponent[]` +
  initial `SalaryRevision` inside one `prisma.$transaction`.
- **Salary edit** = replace components + update `totalMinor` + insert `SalaryRevision`
  atomically.
- **Import** = validate all rows, then commit valid rows in a single `$transaction`
  returning an `ImportReport` (see [`04-data-exchange.md`](./04-data-exchange.md)).

## 6. Seed data (NFR-2)

`@faker-js/faker` generates 10,000 employees across seeded departments, designations,
countries, and currencies. Per the platform PRD, scale is demonstrated by **importing** a
generated 10k sheet through the real import pipeline, not by direct DB auto-population.
