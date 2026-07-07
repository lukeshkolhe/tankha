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
    import-preview.ts          ImportPreview { toInsert: number, conflicts: ConflictRow[], invalid: FailedRow[] }
    import-report.ts           ImportReport { inserted, updated, skippedConflicts, failed: FailedRow[] }
    conflict-row.ts            ConflictRow { rowNumber, employeeCode, changes: FieldChange[] }
    field-change.ts            FieldChange { field, current, incoming, currency? }
    failed-row.ts              FailedRow { rowNumber, employeeCode?, reasons[] }
    employee-row.ts            Parsed row shape (before domain validation)
    sheet-parser.ts            SheetParser port (parse → rows); Sheet writer port (rows → file)
  application/
    preview-import.usecase.ts    Parse → validate → bucket into insert/conflict/invalid; persists nothing
    commit-import.usecase.ts     Re-validate → create new (incl. initial revision) + update selected → report
    export-employees.usecase.ts  Run the same list query as workforce, stream to a sheet
    build-sample-sheet.usecase.ts  Produce the pre-filled, importable template
    dto/                          ImportPreviewView, ImportResultView, CommitImportCommand, ExportQuery
  infrastructure/
    exceljs-sheet.adapter.ts     exceljs (.xlsx) read/write
    fast-csv-sheet.adapter.ts    fast-csv (.csv) read/write
    prisma-import.repository.ts  Bulk insert (Employee + SalaryStructure + components + initial SalaryRevision) + selected updates, one $transaction
  interface/
    data-exchange.controller.ts  Preview, commit, export (stream), sample-sheet (stream)
    dto/                          ImportPreviewDto, ImportResultDto, CommitImportDto
  data-exchange.module.ts
```

**Import is a two-phase flow: preview, then commit.** The user must *see* what an import
would change before anything is written — new rows never surprise them, and existing rows
are **never silently overwritten**.

**Phase 1 — preview** (`PreviewImportUseCase`, persists nothing):
1. `SheetParser` reads the upload (xlsx or csv) into `EmployeeRow[]` (format by
   content-type / extension).
2. Each row is validated with the **exact same** `EmployeeValidation` + compensation
   salary rules as manual entry — no second rule set.
3. Each valid row is bucketed by matching its `employeeCode` against existing DB records:
   - **new** → will be inserted (returned as a count).
   - **conflict** → `employeeCode` already exists; returned as a `ConflictRow` with a
     field-level `changes` diff (`current` → `incoming`, incl. salary total + currency) so
     HR can see exactly what an override would change.
   - **invalid** → returned as a `FailedRow` with reasons (also catches duplicate codes
     *within the file*).

**Phase 2 — commit** (`CommitImportUseCase`): the client re-sends the file plus
`applyEmployeeCodes[]` — the conflicts HR chose to update. The use case **re-parses and
re-validates against current DB state** (stateless; no server-side staging — consistent
with the in-memory upload decision), then in one `prisma.$transaction`:
- creates all new valid rows with the **same record set as manual entry** — `Employee` +
  `SalaryStructure` + components **+ an initial `SalaryRevision`** — bulk-inserted in the one
  transaction (batched for 10k performance, but the creation-history entry is never skipped),
  so imported and hand-added employees are indistinguishable in history (NFR-5),
- **updates only** the conflicts whose `employeeCode` is in `applyEmployeeCodes` (the rest
  are skipped and reported as `skippedConflicts`),
- routes any salary change through compensation's `EditSalaryUseCase`, so an updated
  employee still gets an append-only `SalaryRevision` with an auto-generated remark
  (`"Imported from <filename> on <date>"`) — the audit trail is preserved (FR-3.3/NFR-5).

Atomic — no half-written state (NFR-4). Returns `ImportReport { inserted, updated,
skippedConflicts, failed[] }`.

**Upload handling — in-memory only.** Uploads use Multer `memoryStorage`, so the file
arrives as a `Buffer` on the request; `SheetParser` parses straight from the buffer and it
is discarded when the request ends. **Nothing is persisted to disk or object storage** and
there is no temp file to clean up — the whole pipeline is stateless (which is also why
`commit` re-sends the file rather than referencing server-side staging). A
`ValidationPipe`/interceptor enforces a max file size and the `.xlsx`/`.csv` MIME types.
Streaming very large uploads to disk or object storage, with background processing, is the
fast-follow when files outgrow a synchronous in-memory request (out of MVP scope).

**Sample sheet** = the correct columns pre-filled with a few valid example rows, itself
importable as-is. The 10k seed file (NFR-2) is the same format, just larger — so importing
it exercises this very pipeline at scale.

**Export** reuses `workforce`'s `ListEmployeesQuery` (same filters/search) and streams the
**same columns as the import sample sheet** — core attributes + per-component salary amounts
in **major units** — to xlsx/csv. This keeps exports human-readable and **re-importable**
(export → bulk-edit → import, the annual-increment loop the per-row update flow enables).
Export is current-dataset only (no history).

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

### `POST /employees/import/preview` — dry-run, nothing written (FR-4.1, FR-4.2)
`multipart/form-data` with a `file` field. Returns the three buckets so HR can review
before committing.
```jsonc
// 200 — ImportPreview
{
  "toInsert": 9800,                       // count of new rows that will be created
  "conflicts": [                          // existing employeeCodes — HR decides per row
    { "rowNumber": 12, "employeeCode": "EMP-1042",
      "changes": [
        { "field": "designation", "current": "Engineer", "incoming": "Senior Engineer" },
        { "field": "salaryTotal", "current": 12000000, "incoming": 13500000, "currency": "INR" }
      ] }
  ],
  "invalid": [                            // rejected regardless of choice
    { "rowNumber": 42, "employeeCode": "EMP-1042-DUP",
      "reasons": ["Duplicate employee code within the uploaded file"] },
    { "rowNumber": 118, "employeeCode": "EMP-1118",
      "reasons": ["Unknown department 'Enginering'", "Negative amount for BASIC"] }
  ]
}
```

### `POST /employees/import/commit` — apply, with per-row override choices (FR-4.1, FR-4.2)
`multipart/form-data`: the **same `file`** plus `applyEmployeeCodes` (the conflicts HR ticked
to update). Inserts new rows + updates only the selected conflicts, atomically.
```jsonc
// request (multipart fields)
//   file:               <the same sheet re-sent>
//   applyEmployeeCodes: ["EMP-1042"]      // omit/[] = insert new only, override nothing
// 200 — ImportReport
{ "inserted": 9800, "updated": 1, "skippedConflicts": 0, "failed": [ /* row-level */ ] }
```
Errors (both routes): `400 VALIDATION_ERROR` (unreadable/oversized file, missing required
columns). **Partial success is a `200`** — valid rows commit even when others fail
(US-1/US-2). Commit re-validates against current DB state, so a code that stopped being new
since preview is handled as an (unselected) conflict, not a blind insert.

### `GET /employees/export` — filtered export (FR-4.3)
Same query params as `GET /employees` (page ignored — exports the whole filtered set) plus
`format=xlsx|csv`. Streams a file honouring the current filters/search.
`200`, attachment. **Columns match the import sample sheet exactly** (same order, component
amounts in **major units**), so an export can be edited and re-imported:
`employeeCode, firstName, lastName, department, designation, country, currency, joinDate,
basic, houseRentAllowance, specialAllowance, transportAllowance, annualBonus`. A read-only
`salaryTotal` (major units) column is appended for convenience and is **ignored on import**
(the total is always recomputed from components).

---

## 3. Frontend (import/export UI within `features/employees`)

```
frontend/src/features/employees/         (data-exchange surfaces live alongside the list)
  components/
    ImportDialog.tsx        Download-sample link → file dropzone → runs preview on upload
    ImportPreviewPanel.tsx  Three sections: will-insert count, conflicts (per-row), rejected
    ConflictTable.tsx       One row per conflict with its field diffs + a checkbox; select-all
    ImportResultPanel.tsx   Final counts after commit (inserted / updated / skipped / failed)
    ExportButton.tsx        Exports the current filtered view (reads the same URL params)
  api/
    usePreviewImport.ts     useMutation (multipart) → POST /employees/import/preview
    useCommitImport.ts      useMutation (multipart + applyEmployeeCodes) → …/commit (invalidates list)
    useExportEmployees.ts   Triggers a file download with current filter params
    useSampleSheet.ts       Downloads the template
```

- **Preview before commit is the centrepiece.** On upload, `usePreviewImport` runs first and
  `ImportPreviewPanel` shows: how many rows will be created, a **conflicts** table where each
  existing-employee row is flagged with its field-level diff and a checkbox, and a rejected
  table with plain-language reasons. Nothing is written yet.
- **Overrides are opt-in, per row.** HR ticks the conflicts they want to apply (or
  select-all), then `useCommitImport` re-sends the file with `applyEmployeeCodes`. Unticked
  conflicts are left untouched — the safety rail against a blind bulk overwrite.
- The frontend already holds the `File` in memory from the preview step, so re-sending it on
  commit is free (no re-pick) and keeps the server stateless.
- **Export button** lives on the employee list and reads the **same URL search params** as
  the table, so "export" always means "exactly what I'm looking at" (FR-4.3).
- Import synchronously handles files within a reasonable size for MVP (async/background
  processing for very large files is out of scope).

---

## 4. Traceability

| Requirement | Realised by |
| --- | --- |
| FR-4.1 bulk import w/ row-level validation | `PreviewImportUseCase` reusing `EmployeeValidation` + salary rules |
| FR-4.2 error report; valid rows atomic | preview buckets + `CommitImportUseCase` single-`$transaction` commit |
| FR-4.3 export current/filtered dataset | `ExportEmployeesUseCase` reusing `ListEmployeesQuery` |

**In scope (updated):** per-row *confirmed* updates — the importer flags rows whose
`employeeCode` already exists and lets HR choose, per row, whether to apply the change
(each update is audited via a `SalaryRevision`).

Out of scope (PRD): **blind** bulk upsert (updates are always user-confirmed, never
automatic), custom column-mapping UI, scheduled/async imports, exporting salary history.
