# Module Architecture — Data Import & Export (`data-exchange`)

**Status:** Draft v1 · **Scope:** MVP
**Traces to:** [`../PRD.md`](../PRD.md) FR-4.1–4.3 · [`04-data-exchange PRD`](../module-PRDs/04-data-exchange.md)
**Depends on:** [`workforce`](./02-workforce.md), [`compensation`](./03-compensation.md), [`platform`](./00-platform.md)

The on-ramp off Excel and the safety rail: bulk import with row-level validation and an
actionable error report, plus filtered export. It owns **no domain entity** — it reuses
`workforce` validation and `compensation` salary rules so import and manual entry can never
diverge.

---

## 1. Backend (Clean Architecture layers)

```
backend/src/data-exchange/
  domain/
    import-report.ts           ImportReport { inserted, failed: FailedRow[] }
    failed-row.ts              FailedRow { rowNumber, employeeCode?, reasons[] }
    employee-row.ts            Parsed row shape (before domain validation)
    sheet-parser.ts            SheetParser port (parse → rows); Sheet writer port (rows → file)
  application/
    import-employees.usecase.ts  Parse → validate all → commit valid rows atomically → report
    export-employees.usecase.ts  Run the same list query as workforce, stream to a sheet
    build-sample-sheet.usecase.ts  Produce the pre-filled, importable template
    dto/                          ImportResultView, ExportQuery
  infrastructure/
    exceljs-sheet.adapter.ts     exceljs (.xlsx) read/write
    fast-csv-sheet.adapter.ts    fast-csv (.csv) read/write
    prisma-import.repository.ts  Bulk insert within one $transaction
  interface/
    data-exchange.controller.ts  Import (multipart), export (stream), sample-sheet (stream)
    dto/                          ImportResponseDto
  data-exchange.module.ts
```

**Import pipeline** (`ImportEmployeesUseCase`):
1. `SheetParser` reads the upload (xlsx or csv) into `EmployeeRow[]` (format chosen by
   content-type / extension).
2. Each row is validated with the **exact same** `EmployeeValidation` +
   compensation salary rules used by manual entry — no second rule set. Duplicate
   `employeeCode` is checked both **within the file** and **against existing DB rows**.
3. **Valid rows commit in one `prisma.$transaction`**; invalid rows never touch the DB
   (atomic — no half-written state, NFR-4). MVP import is **create-only** (duplicates are
   rejected, not updated).
4. Returns an `ImportReport { inserted, failed[] }` — the failure list is the product.

**Sample sheet** = the correct columns pre-filled with a few valid example rows, itself
importable as-is. The 10k seed file (NFR-2) is the same format, just larger — so importing
it exercises this very pipeline at scale.

**Export** reuses `workforce`'s `ListEmployeesQuery` (same filters/search) and streams core
attributes + current salary total to xlsx/csv. Export is current-dataset only (no history).

---

## 2. API contract

`Authorization: Bearer <jwt>`, tenant-scoped.

### `GET /employees/sample-sheet?format=xlsx|csv` — template (FR-4.1)
Streams a downloadable, pre-filled, importable file.
`200`, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
(or `text/csv`), `Content-Disposition: attachment; filename="tankha-sample.xlsx"`.

**Sheet columns:** `employeeCode, firstName, lastName, department, designation, country,
currency, joinDate, basic, houseRentAllowance, specialAllowance, transportAllowance, annualBonus`.
(`department`/`designation` by name; `country`/`currency` by ISO code; component columns in
major units, converted to minor on import via `Currency.minorUnitDigits`.)

### `POST /employees/import` — bulk import (FR-4.1, FR-4.2)
`multipart/form-data` with a `file` field.
```jsonc
// 200 — ImportReport (returned even when some rows fail)
{
  "inserted": 9987,
  "failed": [
    { "rowNumber": 42, "employeeCode": "EMP-1042",
      "reasons": ["Duplicate employee code (already exists)"] },
    { "rowNumber": 118, "employeeCode": "EMP-1118",
      "reasons": ["Unknown department 'Enginering'", "Negative amount for BASIC"] }
  ]
}
```
Errors: `400 VALIDATION_ERROR` (unreadable/oversized file, missing required columns).
Note: **partial success is a `200`** — valid rows commit even when others fail (US-1/US-2).

### `GET /employees/export` — filtered export (FR-4.3)
Same query params as `GET /employees` (page ignored — exports the whole filtered set) plus
`format=xlsx|csv`. Streams a file honouring the current filters/search.
`200`, attachment; columns = core attributes + `salaryTotalMinor` + `currency`.

---

## 3. Frontend (import/export UI within `features/employees`)

```
frontend/src/features/employees/         (data-exchange surfaces live alongside the list)
  components/
    ImportDialog.tsx      Download-sample link → file dropzone → submit
    ImportResultPanel.tsx Inserted count + a table of failed rows (rowNumber, code, reasons)
    ExportButton.tsx      Exports the current filtered view (reads the same URL params)
  api/
    useImportEmployees.ts  useMutation (multipart) → POST /employees/import (invalidates list)
    useExportEmployees.ts  Triggers a file download with current filter params
    useSampleSheet.ts      Downloads the template
```

- **Import result is the centrepiece.** After upload, `ImportResultPanel` shows how many
  inserted and a clear, row-level failure table — plain-language reasons, no raw errors.
- **Export button** lives on the employee list and reads the **same URL search params** as
  the table, so "export" always means "exactly what I'm looking at" (FR-4.3).
- Import synchronously handles files within a reasonable size for MVP (async/background
  processing for very large files is out of scope).

---

## 4. Traceability

| Requirement | Realised by |
| --- | --- |
| FR-4.1 bulk import w/ row-level validation | `ImportEmployeesUseCase` reusing `EmployeeValidation` + salary rules |
| FR-4.2 error report; valid rows atomic | `ImportReport` + single `$transaction` commit |
| FR-4.3 export current/filtered dataset | `ExportEmployeesUseCase` reusing `ListEmployeesQuery` |

Out of scope (PRD): update/upsert import, custom column-mapping UI, scheduled/async imports,
exporting salary history.
