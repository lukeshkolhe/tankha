# Module Architecture — Salary & Compensation (`compensation`)

**Status:** Draft v1 · **Scope:** MVP
**Traces to:** [`../PRD.md`](../PRD.md) FR-3.1–3.3 · [`03-compensation PRD`](../module-PRDs/03-compensation.md)
**Depends on:** [`platform`](./00-platform.md), [`workforce`](./02-workforce.md)

Owns the salary structure (components → computed total, per currency) and the append-only
change history that doubles as the appraisal record. This is where money correctness and
auditability are enforced.

---

## 1. Backend (Clean Architecture layers)

```
backend/src/compensation/
  domain/
    salary-structure.entity.ts   Components + computed total; invariant: total = Σ components
    salary-component.vo.ts       Value object (type, amountMinor >= 0)
    salary-revision.entity.ts    Immutable revision (old→new total, remark, changedBy, at)
    salary-total.ts              Pure computeTotal(components): Money (rejects mixed currency)
    salary.repository.ts         SalaryRepository port (getByEmployee, replaceStructure, appendRevision, listRevisions)
    compensation.errors.ts       NegativeAmountError, MissingRemarkError, CurrencyMismatchError
  application/
    set-initial-salary.usecase.ts  Called by workforce create (same tx)
    edit-salary.usecase.ts         Replace components, recompute total, append revision (tx)
    get-salary.usecase.ts          Current structure + total
    list-revisions.usecase.ts      Paged, newest-first history
    dto/                           EditSalaryCommand, SalaryView, RevisionView
  infrastructure/
    prisma-salary.repository.ts    Tenant-scoped; structure + components + revision writes
  interface/
    salary.controller.ts           Nested under /employees/:id/salary
    dto/                           EditSalaryDto (components[], remark — class-validator)
  compensation.module.ts
```

**Correct-by-construction total.** The domain `computeTotal` sums `SalaryComponent`
`Money` values via the platform `Money` VO, which **refuses to add across currencies**. The
total is never accepted from the client — it is always computed server-side and cached in
`SalaryStructure.totalMinor` for fast dashboard aggregation.

**Edit salary** (`EditSalaryUseCase`) in one `$transaction`:
1. Load current structure (tenant-scoped).
2. Validate: amounts ≥ 0, currency unchanged (follows employee), **remark present**.
3. Replace components, recompute + persist `totalMinor`.
4. Append a `SalaryRevision` (`oldTotalMinor`, `newTotalMinor`, `componentsSnapshot`,
   `remark`, `changedByUserId` from `TenantContext`, `createdAt`).

**Append-only history.** Revisions are only ever inserted. `listRevisions` returns them
newest-first via the `([employeeId, createdAt Desc])` index.

**Component set is fixed** for MVP (`SalaryComponentType` enum) — no per-org custom
component definitions. `ANNUAL_BONUS` is a single flat annualised figure summed into the
total like any other component. **Structured/variable bonus** — distinguishing
performance vs retention, guaranteed vs target, or payout frequency — is deliberately out
of scope for MVP (that's variable-comp/payroll territory); it's a candidate fast-follow
modelled as its own concept, not another salary component.

---

## 2. API contract

All nested under an employee; `Authorization: Bearer <jwt>`, tenant-scoped.

### `GET /employees/:id/salary` — current pay (FR-3.1)
```jsonc
// 200
{
  "employeeId": "emp_…",
  "currency": "INR",
  "components": [
    { "type": "BASIC", "amountMinor": 8000000 },
    { "type": "HOUSE_RENT_ALLOWANCE", "amountMinor": 4000000 }
  ],
  "totalMinor": 12000000
}
```

### `PUT /employees/:id/salary` — edit, with reason (FR-3.2, FR-3.3)
```jsonc
// request — remark REQUIRED
{
  "components": [
    { "type": "BASIC", "amountMinor": 9000000 },
    { "type": "HOUSE_RENT_ALLOWANCE", "amountMinor": 4500000 }
  ],
  "remark": "Annual increment — FY25 appraisal, 12% raise"
}
// 200 → updated SalaryView (new totalMinor)
```
Errors: `400 VALIDATION_ERROR` — missing `remark`, negative amount, or a component type
outside the fixed set. Currency is not accepted in the body; it always follows the employee.

### `GET /employees/:id/salary/revisions` — history timeline (FR-3.3)
Paged via the platform convention (default newest-first).
```jsonc
// 200
{
  "data": [
    {
      "id": "rev_…",
      "oldTotalMinor": 12000000, "newTotalMinor": 13500000,
      "currency": "INR",
      "remark": "Annual increment — FY25 appraisal, 12% raise",
      "changedBy": { "id": "usr_…", "name": "Priya Rao" },
      "createdAt": "2026-04-01T09:12:00Z",
      "componentsSnapshot": [ { "type": "BASIC", "amountMinor": 9000000 },
                              { "type": "HOUSE_RENT_ALLOWANCE", "amountMinor": 4500000 } ]
    }
  ],
  "total": 3, "page": 1, "pageSize": 25
}
```
The initial revision (created with the employee) has `oldTotalMinor: null`.

---

## 3. Frontend (`features/compensation`)

Compensation renders **inside** the employee detail page (no standalone route).

```
frontend/src/features/compensation/
  components/
    SalaryBreakdownCard.tsx   Components + total, currency explicit; total is read-only
    EditSalaryModal.tsx       react-hook-form + zod; live-recomputed total; remark required
    RevisionTimeline.tsx      Reverse-chronological list: date, old→new, remark, changedBy
  api/
    useSalary.ts              useQuery → GET /employees/:id/salary
    useEditSalary.ts          useMutation → PUT /employees/:id/salary (invalidates salary + revisions + list)
    useRevisions.ts           useQuery → GET /employees/:id/salary/revisions
```

- **Total is displayed, never edited.** The edit form recomputes the total live from the
  component inputs (client mirror of the server rule) purely for feedback; the server is
  authoritative.
- **Remark is a required field** in the `zod` schema — the save button is disabled until it
  is filled, so the appraisal trail can never be skipped.
- On a successful edit, the mutation invalidates the salary query, the revisions query, and
  the employee list (whose row shows the total) so every surface stays consistent.
- Currency is shown but not editable here — it follows the employee.

---

## 4. Traceability

| Requirement | Realised by |
| --- | --- |
| FR-3.1 components + computed total, per currency | `SalaryStructure` + `computeTotal` (Money VO) + `SalaryComponent` |
| FR-3.2 edit salary | `EditSalaryUseCase` (`PUT …/salary`) |
| FR-3.3 change log (timestamp, old→new, remark) = appraisal record | append-only `SalaryRevision` + required remark + `changedByUserId` |

Out of scope (PRD): net pay/tax/deductions, payslips, FnF, approval workflows, future-dated
changes, per-org custom component definitions.
