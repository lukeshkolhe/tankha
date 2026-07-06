# Tankha — First Requirements Draft (v0.1)

**Goal:** A web-based system for an HR Manager to manage salary data for ~10,000
employees across multiple countries, and to easily answer questions about how the
organisation pays people.
**Primary user:** HR Manager (single persona).
**In one line:** replace the salary spreadsheet with one validated, queryable system
of record.

> This draft is written to be **traceable to `[WHY-TANKHA.md](./WHY-TANKHA.md)`** —
> every pain point there maps to at least one requirement below.

---

## 1. MVP features (requirements)


| ID      | Requirement                                                                                                                                                                        |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1**  | **HR onboarding & organisation** — HR signs up with email, creates an **Organisation**; all data is scoped to that org (multi-tenant isolation). Single HR user, no roles.         |
| **R2**  | **Employee management** — create, view, edit, and deactivate employees. Attributes: name, unique employee ID, department, designation, country, currency, join date, status.       |
| **R3**  | **Structured salary** — salary stored as a small set of **configurable components** (e.g. Basic, Allowances) with a computed total, in the employee's **own currency**.            |
| **R4**  | **Salary edit + history** — HR can edit an employee's salary; every change is logged with **timestamp, old → new value, and a remark** (this also serves as the appraisal record). |
| **R5**  | **Validation & guardrails** — enforce required fields, unique employee ID, non-negative salary, and valid designation/department — on both manual entry **and** import.            |
| **R6**  | **Excel/CSV import** — bulk-upload employees & salaries, with row-level validation and a clear **error report** for rejected rows.                                                 |
| **R7**  | **Excel/CSV export** — export the current (optionally filtered) employee & salary dataset.                                                                                         |
| **R8**  | **Dashboard & analysis** — overview of salary data with **breakdowns and filters** (e.g. headcount and average/total compensation by department and country) plus search.          |
| **R9**  | **Built for scale** — handle **10,000 employees** via server-side pagination, search, and filtering; ship a **seed script** that generates 10,000 employees.                       |
| **R10** | **Multi-country / multi-currency** — each employee is mapped to a country and a currency; amounts are shown per currency (no FX conversion).                                       |


---

## 2. How Tankha answers each "Why"

### Data integrity & accuracy


| Pain point (Why)                                  | What Tankha does                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| No validation — typos/wrong formulas corrupt data | **R5** validates every field on entry and import; **R3** removes manual formulas (totals are computed). |
| No single source of truth — many sheet versions   | **R1 + R2** — one org-scoped database is the only source of truth.                                      |
| Errors compound at scale                          | **R5 + R3** — no fragile cell references; invalid data is rejected before it lands.                     |


### Querying & analysis


| Pain point (Why)                               | What Tankha does                                                                                    |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Every question is manual (pivots each time)    | **R8** — dashboard with ready breakdowns and filters answers common questions instantly.            |
| No historical view — old salary is overwritten | **R4** — salary-edit history preserves every past value with date and remark.                       |
| Cross-referencing is fragile (VLOOKUPs)        | **R8 + R2** — a relational model lets HR slice by department, country, tenure without manual joins. |


### Collaboration & access control


| Pain point (Why)                                  | What Tankha does                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| No access control — anyone with the file can edit | **R1** — access requires an authenticated HR account, and data is isolated per organisation.       |
| No audit trail — who changed what, when, why      | **R4** — timestamped change log with a remark on every salary edit.                                |
| Concurrent editing conflicts                      | **R1 + R2** — a single server-side source of truth replaces emailed files; no overwrite conflicts. |


### Scale


| Pain point (Why)                    | What Tankha does                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Excel buckles before 10,000 rows    | **R9** — a database-backed app with server-side pagination/search, proven with a 10k seed.                  |
| Bulk updates are risky, no rollback | **R6** — validated bulk import rejects bad rows and reports them, instead of silently corrupting thousands. |


### Process & compliance risk


| Pain point (Why)                                                   | What Tankha does                                                                        |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| No guardrails (invalid designation, negative salary, duplicate ID) | **R5** — these are enforced as hard validation rules.                                   |
| Weak audit readiness — no change history                           | **R4** — a timestamped, remark-tagged history demonstrates control over salary changes. |


### Multi-country & multi-currency *(newly added to the Why)*


| Pain point (Why)                                                | What Tankha does                                                                              |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Currencies collide in one sheet; no consistent per-country view | **R10** — every employee carries a country and currency; the dashboard slices pay by country. |


---

## 3. Deliberately out of scope (and why)

- **Payroll operations — tax/deduction calculation, net pay, payslip generation, Full & Final settlement** — the goal is *understanding* compensation, not running payroll; these are operational and out of MVP scope.
- **Real money movement / bank & payment-gateway integration** — the system manages data, it does not pay anyone.
- **FX conversion between currencies** — amounts stay in each employee's currency; live FX adds complexity without new value.
- **Statutory tax filing & compliance documents** (Form 16 / W-2 / filings) — legal/compliance depth beyond the assignment.
- **Employee self-service & role-based access control** — single HR persona; no per-employee logins or permission matrix.
- **Full appraisal-cycle workflow** — covered simply by the salary-edit history (R4); no review/approval cycle.
- **Enterprise integrations (SAP/Workday/ADP/SSO), mobile apps, security certifications** — not core to the MVP.

