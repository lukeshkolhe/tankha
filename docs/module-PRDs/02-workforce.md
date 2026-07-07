# Module PRD — Employee Management (`workforce`)

**Status:** Draft v1 · **Owner:** Product · **Scope:** MVP
**Traces to:** [`../PRD.md`](../PRD.md) — FR-2.1, FR-2.2, FR-2.3, FR-2.4
**Depends on:** [Platform](./00-platform.md), [Access](./01-access.md), [Compensation](./03-compensation.md) (for initial salary)

---

## 1. Problem & why it matters

In the spreadsheet world, an "employee" is just a row — and rows are fragile. There's
no guarantee two people didn't get the same employee ID, no stopping an invalid
department or a blank join date, and answering "how many people do we have in India?"
means filtering and re-pivoting by hand every time. At 10,000 rows across countries,
Excel is slow and error-prone, and every question is manual.

The employee record is the **spine of the whole product** — salaries hang off it,
imports create it, and the dashboard counts it. If the employee data isn't clean and
queryable, nothing downstream can be trusted. This module makes the employee a
first-class, validated, searchable record.

## 2. Users & jobs-to-be-done

**Primary user:** HR Manager.

- *"When I onboard someone, I want to capture them once, correctly, so I never chase
  down which spreadsheet has the right details."*
- *"When someone leaves, I want to deactivate them without losing their history."*
- *"When I need to find or slice people, I want to search and filter instantly instead
  of building a pivot table."*

## 3. Goals & success metrics

**Goal:** One canonical, validated employee record that stays fast and answerable at
10,000+ employees.

| Metric | Target | Why it matters |
| --- | --- | --- |
| Employee list loads (filtered/searched) at 10k records | < 1s perceived | Excel buckles here; speed is the differentiator |
| Records rejected for invalid data at entry | 100% of invalid attempts caught | "No guardrails" is a top pain point |
| Duplicate employee IDs within an org | **0** | Broken cross-references start here |
| HR can answer "how many in dept/country X" without exporting | Yes, in-app | Kills the "every question is manual" tax |

## 4. User stories & acceptance criteria

**US-1 — Add an employee (P0)**
> As an HR Manager, I want to add an employee with their core details, so that they
> exist as one trustworthy record.

- [ ] I can capture name, unique employee ID, department, designation, country,
      currency, and join date.
- [ ] Their starting salary is captured at the same time (delegated to Compensation).
- [ ] Invalid or missing required fields are rejected with a clear reason before saving.
- [ ] A duplicate employee ID within my org is refused.

**US-2 — Edit an employee (P0)**
> As an HR Manager, I want to correct or update an employee's details, so the record
> stays accurate.

- [ ] I can update core attributes; validation applies on edit too.
- [ ] Salary changes are handled through the salary flow, not raw field editing.

**US-3 — Deactivate an employee (P0)**
> As an HR Manager, I want to deactivate someone who has left, so they drop out of
> active views without erasing their history.

- [ ] Deactivation is a status change, not a delete — the record and its history remain.
- [ ] Deactivated employees can be filtered in or out of the list.

**US-4 — Find and slice employees (P0)**
> As an HR Manager, I want to search and filter the employee list, so I can answer
> questions instantly.

- [ ] I can search by name / employee ID and filter by department, country, and status.
- [ ] The list is paginated and stays responsive at 10,000 employees.
- [ ] Each row shows the employee's current salary total and currency at a glance.
- [ ] My current filters/search are shareable and survive a page refresh.

## 5. Functional requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-2.1 | Create, view, edit, deactivate employees | P0 |
| FR-2.2 | Core attributes incl. unique employee ID, country, currency | P0 |
| FR-2.3 | Validation & guardrails (required fields, unique ID, valid refs, non-negative salary) | P0 |
| FR-2.4 | Server-side search, filter, pagination | P0 |

**Note:** the validation rules here are the *same rules* the bulk importer ([Data Exchange](./04-data-exchange.md)) uses,
so manual entry and import can never disagree about what "valid" means.

## 6. Key user flows / UX

- **List** — the home base: a fast, server-paginated table with search and
  department/country/status filters, an export button, and an "add employee" action.
  Filters live in the URL so a view can be bookmarked or shared.
- **Detail** — one employee's attributes plus their current salary breakdown and
  history (from [Compensation](./03-compensation.md)).
- **Create / Edit** — a guided form with reference dropdowns (departments,
  designations) and inline validation.

## 7. Out of scope (MVP)

Manager/reporting hierarchy and org charts, custom fields, a bulk-edit UI (bulk changes
go through import), and employee documents/photos. (See the out-of-scope list in
[`../PRD.md`](../PRD.md).)

Also out of scope: **automatic country→currency mapping / defaulting.** For MVP, country
and currency are captured and validated as **independent ISO fields** — Tankha does not
enforce or auto-fill a currency from the chosen country. (A real country→currency
relationship is many-to-many — one currency spans many countries, and employees can be
paid in a non-local currency — so a strict mapping would reject valid data.) A smart
default-from-country is a candidate fast-follow, not MVP. Keeping them independent is why
compensation totals are always grouped strictly per currency (see
[Insights](./05-insights.md)).

## 8. Dependencies & assumptions

- Departments, designations, countries, and currencies come from reference lists.
- Depends on Compensation for the salary captured at creation and shown on detail.
- Feeds employee identity to [Data Exchange](./04-data-exchange.md) and [Insights](./05-insights.md).

## 9. Risks & open questions

- **Reference data management:** for MVP, how do departments/designations get seeded or
  edited — fixed list, or HR-editable? Affects the create form and import validation.
- **Risk:** search/filter performance at 10k is the make-or-break vs. Excel; it must be
  validated early against realistic seed data.
