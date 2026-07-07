# Module PRD — Data Import & Export (`data-exchange`)

**Status:** Draft v1 · **Owner:** Product · **Scope:** MVP
**Traces to:** [`../PRD.md`](../PRD.md) — FR-4.1, FR-4.2, FR-4.3
**Depends on:** [Workforce](./02-workforce.md), [Compensation](./03-compensation.md), [Platform](./00-platform.md)

---

## 1. Problem & why it matters

HR isn't starting from zero — they already have 10,000 employees in Excel. If moving to
Tankha means re-typing all of that by hand, adoption dies on day one. And even inside a
spreadsheet, bulk changes are terrifying: an annual increment cycle is one bad paste or
drag-fill away from corrupting thousands of records, with **no rollback**.

This module is the on-ramp *and* the safety rail. It lets HR bulk-import their existing
data with row-level validation and a clear error report, so a messy file doesn't
silently poison the system of record. Export closes the loop — data can still leave for
offline use — which lowers the risk of committing to a new tool.

## 2. Users & jobs-to-be-done

**Primary user:** HR Manager.

- *"When I move to Tankha, I want to upload my existing spreadsheet and have it just
  work, so I don't re-enter 10,000 people."*
- *"When some rows are bad, I want to know exactly which ones and why, so I can fix and
  re-upload with confidence."*
- *"When I need the data elsewhere, I want to export the current view to Excel."*

## 3. Goals & success metrics

**Goal:** A trustworthy bridge off Excel — bulk data in, with no silent corruption, and
a clean path back out.

| Metric | Target | Why it matters |
| --- | --- | --- |
| Bad rows imported silently (no report) | **0** | The whole point is no silent corruption |
| Import error report is row-level and actionable | Yes | HR must know *which* row and *why* |
| Time to import 10,000 valid employees | Minutes, not a day | Adoption depends on a fast on-ramp |
| Valid rows still commit when some rows fail | Yes (partial import) | One typo shouldn't block a whole file |

## 4. User stories & acceptance criteria

**US-1 — Bulk import employees & salaries (P0)**
> As an HR Manager, I want to upload my Excel/CSV of employees and salaries, so I can
> populate Tankha without manual re-entry.

- [ ] I can download a **sample sheet** — the correct columns *pre-filled with a few
      example rows* — so I can see exactly what a valid file looks like.
- [ ] The sample sheet is itself importable: I can download it and import it as-is to
      try the flow and get starter data in, rather than the system auto-populating.
- [ ] I can upload an Excel or CSV file of employees + salaries.
- [ ] Each row is validated with the **same rules** as manual entry ([Workforce](./02-workforce.md) / [Compensation](./03-compensation.md)).
- [ ] Valid rows are committed; the import doesn't leave data half-written.

**US-2 — Understand what failed (P0)**
> As an HR Manager, when rows are rejected, I want a clear report of which rows and why,
> so I can fix and re-upload.

- [ ] After import I see how many rows were inserted and how many failed.
- [ ] Each failed row is listed with its row number, employee ID (if present), and
      reason(s).
- [ ] Duplicate employee IDs — within the file or against existing records — are
      rejected and reported (MVP is create-only, not update).

**US-3 — Export the current dataset (P0)**
> As an HR Manager, I want to export the employees I'm currently viewing to Excel/CSV,
> so I can use the data offline.

- [ ] Export respects the filters/search currently applied to the employee list.
- [ ] The exported file includes core attributes and current salary total.

## 5. Functional requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-4.1 | Bulk import from Excel/CSV with row-level validation | P0 |
| FR-4.2 | Error report for rejected rows; valid rows committed atomically | P0 |
| FR-4.3 | Export current/filtered employee + salary dataset | P0 |

## 6. Key user flows / UX

- **Import** — download sample sheet (pre-filled, importable) → upload file → see a
  result screen: inserted count plus a table of failed rows with plain-language reasons.
  Errors are the product here, so they must be clear and actionable.
- **Export** — a button on the employee list that exports exactly the view currently on
  screen (same filters).

## 7. Out of scope (MVP)

Update/upsert mode (import is create-only), a custom column-mapping UI, scheduled or
automated imports, async processing for very large files (synchronous within a
reasonable size), and exporting salary *history* (current dataset only). (See the
out-of-scope list in [`../PRD.md`](../PRD.md).)

## 8. Dependencies & assumptions

- Reuses [Workforce](./02-workforce.md) validation and [Compensation](./03-compensation.md) salary rules — **no separate
  rule set**, so import and manual entry never diverge.
- Assumes files are within a size handled comfortably in a synchronous request for MVP.

## 9. Risks & open questions

- **Create-only limitation:** HR's most feared moment — the annual increment cycle — is
  a *bulk update*, which MVP doesn't support via import. Worth flagging as the top
  fast-follow candidate.
- **Open question:** what's the realistic max file size we must handle synchronously
  before we need background processing?
