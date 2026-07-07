# Module Architecture — Employee Management (`workforce`)

**Status:** Draft v1 · **Scope:** MVP
**Traces to:** [`../PRD.md`](../PRD.md) FR-2.1–2.4 · [`02-workforce PRD`](../module-PRDs/02-workforce.md)
**Depends on:** [`platform`](./00-platform.md), [`access`](./01-access.md), [`compensation`](./03-compensation.md)

The employee record is the spine of the product. This module owns the `Employee` entity,
its validation rules (reused by the importer), the reference lists, and the fast,
server-paginated list at 10k scale.

---

## 1. Backend (Clean Architecture layers)

```
backend/src/workforce/
  domain/
    employee.entity.ts             Employee aggregate (attributes, status, lifecycle)
    employee-validation.ts         THE reusable rule set (required, non-negative, valid refs)
    employee.repository.ts         EmployeeRepository port (findPaged, findById, create, update)
    reference.repository.ts        ReferenceRepository port (departments, designations, countries, currencies)
    workforce.errors.ts            DuplicateEmployeeCodeError, InvalidReferenceError
  application/
    create-employee.usecase.ts     Validates + creates employee & initial salary (tx, delegates to compensation)
    update-employee.usecase.ts     Validates + updates core attributes (not salary)
    deactivate-employee.usecase.ts Status → INACTIVE (soft, history preserved)
    list-employees.usecase.ts      Paged/filtered/searched query
    get-employee.usecase.ts        Detail incl. current salary summary
    dto/                           CreateEmployeeCommand, ListEmployeesQuery, EmployeeView, EmployeeRowView
  infrastructure/
    prisma-employee.repository.ts  Tenant-scoped Prisma queries + index-backed listing
    prisma-reference.repository.ts
  interface/
    employees.controller.ts        REST endpoints
    reference.controller.ts        Reference dropdown endpoints
    dto/                           CreateEmployeeDto, UpdateEmployeeDto, ListEmployeesQueryDto (class-validator)
  workforce.module.ts
```

**`EmployeeValidation`** is the single rule set (required fields, unique `employeeCode` per
org, valid `departmentId`/`designationId`/`countryCode`/`currencyCode`, non-negative
salary). It is a pure domain function consumed by **both** `CreateEmployeeUseCase` and the
importer in [`04-data-exchange.md`](./04-data-exchange.md) — manual entry and import can
never disagree about "valid".

**Create employee** delegates salary creation to `compensation`'s `SetInitialSalary`
use case within one `$transaction`: employee + salary structure + components + initial
`SalaryRevision` are written atomically (NFR-4). This is the **only** cross-module edge and
it is one-directional — `compensation` never calls back into `workforce` (see
[`03-compensation.md`](./03-compensation.md)), so there is no DI cycle.

**Listing** uses the shared pagination convention and is backed by the composite indexes in
[`database-schema.md`](./database-schema.md). Each row is projected to `EmployeeRowView`,
which includes the employee's current `totalMinor` + `currencyCode` read directly from the
`SalaryStructure` projection (a deliberate read-only join, not a module call) so the list
shows pay at a glance without an N+1.

---

## 2. API contract

Base `/api/v1`, all routes require `Authorization: Bearer <jwt>` and are tenant-scoped.

### `GET /employees` — list (FR-2.4)
Query params per the [platform pagination convention](./00-platform.md): `page`,
`pageSize`, `sort` (`lastName|joinDate|salaryTotal`), `search`, plus filters `department`,
`designation`, `country`, `status`.
```jsonc
// 200
{
  "data": [
    {
      "id": "emp_…", "employeeCode": "EMP-1001",
      "firstName": "Ravi", "lastName": "Kumar",
      "department": "Engineering", "designation": "Senior Engineer",
      "country": "IN", "currency": "INR",
      "status": "ACTIVE", "joinDate": "2021-04-01",
      "salaryTotalMinor": 12000000
    }
  ],
  "total": 10000, "page": 1, "pageSize": 25
}
```

### `POST /employees` — create (FR-2.1, FR-2.3)
```jsonc
// request — core attrs + initial salary (delegated to compensation)
{
  "employeeCode": "EMP-1001",
  "firstName": "Ravi", "lastName": "Kumar",
  "departmentId": "dep_…", "designationId": "des_…",
  "countryCode": "IN", "currencyCode": "INR",
  "joinDate": "2021-04-01",
  "salary": { "components": [ { "type": "BASIC", "amountMinor": 8000000 },
                              { "type": "HOUSE_RENT_ALLOWANCE", "amountMinor": 4000000 } ] }
}
// 201 → full EmployeeView (attrs + current salary breakdown + total)
```
Errors: `400 VALIDATION_ERROR` (missing/invalid fields, negative amount),
`409 CONFLICT` (duplicate `employeeCode`), `400` (unknown reference id).

### `GET /employees/:id` — detail
Returns `EmployeeView`: attributes + current salary structure (components + total) +
link to history (history payload served by [`compensation`](./03-compensation.md)).

### `PATCH /employees/:id` — edit attributes (FR-2.1)
Body: any subset of core attributes (**not** salary — salary goes through compensation).
`200 → EmployeeView`. Errors as create.

### `POST /employees/:id/deactivate` — soft deactivate (FR-2.1)
Sets `status = INACTIVE`; record + history preserved. `200 → EmployeeView`.
(A symmetrical `POST /employees/:id/reactivate` restores `ACTIVE`.)

### Reference endpoints (feed dropdowns + import/validation)
```
GET /reference/departments   → [{ id, name }]
GET /reference/designations  → [{ id, name }]
GET /reference/countries     → [{ code, name }]                 (global ISO)
GET /reference/currencies    → [{ code, name, symbol, minorUnitDigits }]  (global ISO)
```

---

## 3. Frontend (`features/employees`)

```
frontend/src/features/employees/
  routes/
    EmployeeListPage.tsx      Server-paginated Mantine/TanStack table
    EmployeeDetailPage.tsx    Attributes + salary breakdown + history (compensation)
    EmployeeCreatePage.tsx
    EmployeeEditPage.tsx
  components/
    EmployeeTable.tsx         Columns incl. current salary + currency; server-side paging
    EmployeeFilters.tsx       Department/country/status filters + search box
    EmployeeForm.tsx          react-hook-form + zod; reference dropdowns; inline validation
  api/
    useEmployees.ts           useQuery(['employees', urlParams]) → GET /employees
    useEmployee.ts            useQuery → GET /employees/:id
    useCreateEmployee.ts      useMutation → POST /employees (invalidates list)
    useUpdateEmployee.ts      useMutation → PATCH /employees/:id
    useDeactivateEmployee.ts  useMutation → POST /employees/:id/deactivate
    useReferenceData.ts       useQuery(['reference', kind]) — cached, rarely changes
```

- **Filters/search/sort/page live in the URL** (React Router search params). The URL string
  *is* the TanStack Query key, so changing a filter refetches the right page and the view is
  bookmarkable and refresh-safe (FR-2.4, shared with [`insights`](./05-insights.md)).
- **Server-side pagination** on the table (never fetch 10k rows) meets the < 1s bar.
- **Create/Edit form** validates with a `zod` schema mirroring the request DTO; reference
  dropdowns come from `useReferenceData`; server field-level `details` map onto form errors.
- Country and currency are **independent** ISO selects — no auto-fill of currency from
  country (per PRD; the many-to-many reality would reject valid data).

---

## 4. Traceability

| Requirement | Realised by |
| --- | --- |
| FR-2.1 CRUD + deactivate | `employees.controller` + create/update/deactivate use cases (soft status) |
| FR-2.2 core attrs incl. unique code, country, currency | `Employee` entity + `@@unique([organisationId, employeeCode])` |
| FR-2.3 validation & guardrails | `EmployeeValidation` (shared with importer) + DB constraints |
| FR-2.4 server-side search/filter/pagination | `ListEmployees` + platform convention + composite indexes + URL-state FE |

Out of scope (PRD): reporting hierarchy/org charts, custom fields, bulk-edit UI (goes
through import), employee documents/photos, country→currency auto-mapping.
