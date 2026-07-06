# Tankha — Product Requirements Document (PRD)

**Status:** Draft v1 · **Owner:** Product · **Scope:** MVP
**Related:** `[WHY-TANKHA.md](./WHY-TANKHA.md)` (problem & motivation)

> **This document is the source of truth for the Tankha codebase.** Each module below
> will later get its own detailed PRD; those must trace back to the requirements here.

---

## 1. Overview

**Tankha** is a web-based salary-management system that replaces the HR team's
salary spreadsheets with a single, validated, queryable system of record.

ACME's HR team manages salary data for ~10,000 employees across multiple countries
entirely in Excel — a process that is error-prone, hard to query, and impossible to
audit (see `WHY-TANKHA.md`). Tankha lets an **HR Manager** onboard their organisation,
import and manage employee salary data, track every change, and understand *how the
organisation pays people* through a clear dashboard.

**Primary user:** HR Manager (single persona).
**Product principle:** optimise for *managing and understanding* compensation data —
**not** for running payroll.

---

## 2. Goals & non-goals

**Goals**

- Give HR one trustworthy, validated source of salary data for 10,000+ employees.
- Make it easy to answer questions about how the org pays people.
- Preserve a full, auditable history of salary changes.
- Bridge smoothly from the existing Excel workflow (import & export).

**Non-goals (MVP)** — see Section 7 for the full list with reasons.

- Not a payroll engine (no tax/net-pay calculation, payslips, or Full & Final settlement).
- No employee self-service or role-based access control.
- No real money movement or third-party integrations.

---

## 3. Users & personas


| Persona                       | Description                                                      | Needs                                                                                          |
| ----------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **HR Manager** (only persona) | Owns salary data for the organisation. Currently lives in Excel. | Sign up, set up the org, import/manage employees & salaries, and get answers from a dashboard. |


There are no employee logins and no secondary roles in the MVP.

---

## 4. System modules

The MVP is organised into five functional modules plus a platform layer. Each will
have its own module PRD.

1. **Authentication & Organisation** — onboarding, tenant isolation.
2. **Employee Management** — the employee system of record.
3. **Salary & Compensation** — salary structure and change history.
4. **Data Import & Export** — Excel/CSV bridge.
5. **Dashboard & Analytics** — understanding how the org pays people.
6. **Platform / Non-functional** — scale, data integrity, tech constraints.

---

## 5. Functional requirements

Each requirement notes the **Why** (pain point from `WHY-TANKHA.md`) it addresses.

### 5.1 Authentication & Organisation


| ID         | Requirement                                                                                                  | Why it solves                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| **FR-1.1** | HR signs up and logs in with **email + password**.                                                           | *No access control* — data now sits behind authentication instead of an open file. |
| **FR-1.2** | On first login, HR **creates an Organisation**; the HR account owns it.                                      | *No single source of truth* — one org, one dataset.                                |
| **FR-1.3** | All data is **scoped to the organisation** (multi-tenant isolation); a user only ever sees their org's data. | *No access control* — replaces "anyone with the file can see everyone's pay."      |


### 5.2 Employee Management


| ID         | Requirement                                                                                                                 | Why it solves                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **FR-2.1** | Create, view, edit, and deactivate employees.                                                                               | *No single source of truth* — one canonical employee record.                            |
| **FR-2.2** | Model core attributes: name, **unique employee ID**, department, designation, **country**, **currency**, join date, status. | *Cross-referencing is fragile* — structured fields replace ad-hoc columns and VLOOKUPs. |
| **FR-2.3** | Enforce **validation**: required fields, unique employee ID, valid department/designation, non-negative salary.             | *No validation* / *No guardrails* — invalid data is rejected at the source.             |
| **FR-2.4** | Employee list with **server-side search, filter, and pagination**.                                                          | *Excel buckles at scale* / *Every question is manual*.                                  |


### 5.3 Salary & Compensation


| ID         | Requirement                                                                                                                                            | Why it solves                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| **FR-3.1** | Salary is stored as a small set of **configurable components** (e.g. Basic, Allowances) with a **computed total**, in the employee's own **currency**. | *Errors compound* (no manual formulas) / *Currencies collide*.    |
| **FR-3.2** | HR can **edit** an employee's salary.                                                                                                                  | *No single source of truth*.                                      |
| **FR-3.3** | Every salary change is recorded in a **history log**: timestamp, old → new value, and a **remark**. This also serves as the appraisal record.          | *No historical view* / *No audit trail* / *Weak audit readiness*. |


### 5.4 Data Import & Export


| ID         | Requirement                                                                                                 | Why it solves                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **FR-4.1** | **Bulk import** employees & salaries from Excel/CSV, with row-level validation.                             | *Transitioning from Excel* / *Bulk updates are risky*.                   |
| **FR-4.2** | Import produces an **error report** listing rejected rows and reasons; valid rows are committed atomically. | *Bulk updates are risky, no rollback* / *No validation*.                 |
| **FR-4.3** | **Export** the current (optionally filtered) employee & salary dataset to Excel/CSV.                        | Closes the Excel loop — data can still leave the system for offline use. |


### 5.5 Dashboard & Analytics


| ID         | Requirement                                                                                       | Why it solves                                           |
| ---------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **FR-5.1** | Overview dashboard with key stats: headcount, total & average compensation.                       | *Every question is manual*.                             |
| **FR-5.2** | **Breakdowns** of compensation **by department and by country** (and other available dimensions). | *Cross-referencing is fragile* / *No per-country view*. |
| **FR-5.3** | Filter and search across the dashboard and employee data.                                         | *Every question is manual*.                             |


---

## 6. Non-functional requirements


| ID        | Requirement                                                                                                                                                                   | Why / Note                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **NFR-1** | Support **10,000 employees** smoothly via server-side pagination, search, and filtering.                                                                                      | *Excel buckles before 10,000 rows*.                 |
| **NFR-2** | Provide a **seed script** that generates 10,000 realistic employees.                                                                                                          | Assignment requirement; demonstrates scale.         |
| **NFR-3** | **Multi-currency:** each employee is mapped to a country and currency; amounts shown per currency (**no FX conversion**).                                                     | *Currencies collide in one sheet*.                  |
| **NFR-4** | **Data integrity:** database constraints + transactional writes (esp. for imports).                                                                                           | *Errors compound* / *Concurrent editing conflicts*. |
| **NFR-5** | **Auditability:** salary changes are timestamped and attributable.                                                                                                            | *Weak audit readiness*.                             |
| **NFR-6** | **Tech constraints:** relational DB (e.g. SQLite/Postgres); React/Next.js UI; meaningful, fast, deterministic unit tests; deployed & demoable web app (responsive, web-only). | Assignment technical constraints.                   |


---

## 7. Dropped / out-of-scope requirements (MVP)

Deliberately excluded to keep the MVP focused on *managing and understanding* salary
data. Each can be revisited post-MVP.


| Dropped requirement                                                                                 | Reason                                                                                     |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Tax & deduction calculation / net pay**                                                           | Operational payroll, not core to understanding compensation; large per-country complexity. |
| **Payslip generation (PDF)**                                                                        | Payroll output artifact; out of MVP core.                                                  |
| **Full & Final (FnF) settlement**                                                                   | Operational separation workflow; not needed to understand pay.                             |
| **Real money movement / bank & payment-gateway integration**                                        | Tankha manages data; it does not pay anyone. Requires banking & compliance.                |
| **FX conversion between currencies**                                                                | Amounts stay per-currency; live FX adds complexity without new value.                      |
| **Statutory tax filing & documents (Form 16 / W-2 / filings)**                                      | Legal/compliance depth beyond scope.                                                       |
| **Employee self-service portal**                                                                    | Single HR persona; no employee logins in MVP.                                              |
| **Role-based access control / field-level masking**                                                 | One HR user per org; no permission matrix needed yet.                                      |
| **Full appraisal-cycle workflow (review/approval)**                                                 | Covered simply by the salary-edit history (FR-3.3); no cycle needed.                       |
| **Payroll edge cases** (loans/advances, LOP proration, transfers, arrears, off-cycle runs)          | Not core to demonstrating the system.                                                      |
| **Enterprise integrations (SAP/Workday/ADP/SSO), mobile apps, security certifications (SOC 2/ISO)** | Beyond MVP; no external systems in the assignment context.                                 |


---

## 8. High-level data model

Indicative entities (module PRDs will detail schemas):

- **Organisation** — the tenant; owned by one HR user.
- **User (HR Manager)** — belongs to an Organisation.
- **Employee** — belongs to an Organisation; core attributes (FR-2.2).
- **SalaryStructure** — the employee's current components + total + currency (FR-3.1).
- **SalaryChange** — history entries: timestamp, old → new, remark (FR-3.3).
- **Reference data** — Department, Designation, Country, Currency.

Relationships: `Organisation 1─* Employee`, `Employee 1─1 SalaryStructure`,
`Employee 1─* SalaryChange`.

---

## 9. Traceability

Every pain point in `WHY-TANKHA.md` maps to at least one requirement above:


| Why (pain area)                | Covered by                    |
| ------------------------------ | ----------------------------- |
| Data integrity & accuracy      | FR-2.3, FR-3.1, NFR-4         |
| Querying & analysis            | FR-2.4, FR-3.3, FR-5.1–5.3    |
| Collaboration & access control | FR-1.1, FR-1.3, FR-3.3        |
| Scale                          | FR-2.4, NFR-1, NFR-2          |
| Process & compliance risk      | FR-2.3, FR-3.3, NFR-5         |
| Multi-country & multi-currency | FR-2.2, FR-3.1, FR-5.2, NFR-3 |


---

