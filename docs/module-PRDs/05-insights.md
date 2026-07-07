# Module PRD — Dashboard & Analytics (`insights`)

**Status:** Draft v1 · **Owner:** Product · **Scope:** MVP
**Traces to:** [`../PRD.md`](../PRD.md) — FR-5.1, FR-5.2, FR-5.3
**Depends on:** [Workforce](./02-workforce.md), [Compensation](./03-compensation.md) — read-only — and [Platform](./00-platform.md)

---

## 1. Problem & why it matters

Clean, validated data is only half the value — HR also needs *answers*. "What's our
average CTC in Engineering vs. Sales?" "How does each country compare?" In Excel every
one of these is a manual filter-and-pivot, redone from scratch each time, and
cross-referencing salary with department or location relies on fragile VLOOKUPs.

This is the module that makes the whole product feel worth it: it turns the system of
record into an instant, always-current picture of **how the organisation pays people**.
It's read-only — it never changes data, it just illuminates it.

## 2. Users & jobs-to-be-done

**Primary user:** HR Manager.

- *"When leadership asks about our comp spend, I want the headcount and totals on one
  screen, so I answer immediately instead of building a pivot."*
- *"When I compare teams or regions, I want a breakdown by department and country
  without slicing a spreadsheet by hand."*

## 3. Goals & success metrics

**Goal:** Answer the common "how do we pay people?" questions instantly, and never
mislead by mixing currencies.

| Metric | Target | Why it matters |
| --- | --- | --- |
| Common comp questions answered without export/pivot | 100% of the supported set | Removes the "every question is manual" tax |
| Dashboard load at 10k employees | < 1s perceived | Must feel instant to beat Excel |
| Cross-currency "grand totals" ever shown | **0** | Mixing currencies would be actively wrong |
| Dashboard and employee list agree under the same filters | Always | Trust dies if numbers disagree across screens |

## 4. User stories & acceptance criteria

**US-1 — Overview at a glance (P0)**
> As an HR Manager, I want key stats on one screen, so I can answer basic questions
> immediately.

- [ ] I see total headcount.
- [ ] I see total and average compensation — **grouped by currency**, never summed
      across currencies.

**US-2 — Breakdowns by department and country (P0)**
> As an HR Manager, I want compensation broken down by department and by country, so I
> can compare teams and regions.

- [ ] I can view headcount, total, and average comp by department.
- [ ] I can view the same by country.
- [ ] Every monetary figure is explicit about its currency.

**US-3 — Filter and search the view (P0)**
> As an HR Manager, I want to filter the dashboard the same way I filter the employee
> list, so the two stay consistent.

- [ ] Dashboard filters (department, country, status, search) match the employee list's.
- [ ] Filters live in the URL and are shareable; the list and dashboard reflect the same
      filtered population.

## 5. Functional requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-5.1 | Overview stats: headcount, total & average compensation | P0 |
| FR-5.2 | Breakdowns by department and country | P0 |
| FR-5.3 | Filter and search across dashboard and employee data | P0 |

## 6. Key design constraint — multi-currency, no FX

Because employees are paid in different currencies and Tankha does **no FX conversion**
(see [`../PRD.md`](../PRD.md) NFR-3), monetary totals **cannot be summed across
currencies**. Every money figure on the dashboard is therefore shown **per currency**.
Headcount, being a count, is currency-agnostic. This is a deliberate product decision to
never show a misleading blended number, not a limitation to apologise for.

## 7. Key user flows / UX

- **Overview cards** — headcount plus per-currency total and average compensation.
- **Breakdown views** — by department and by country, as table + chart (charts follow
  the `dataviz` guidance), with currency always explicit.
- **Shared filters** — the same URL-based filters as the employee list, so drilling in
  one place is reflected in the other.

## 8. Out of scope (MVP)

Natural-language / AI query assistant, pay-equity and gender-gap analysis,
budget-vs-actual, year-over-year trends, a custom report builder, and any cross-currency
"grand total." (See the out-of-scope list in [`../PRD.md`](../PRD.md).)

## 9. Dependencies & assumptions

- Pure read-side over [Workforce](./02-workforce.md) and [Compensation](./03-compensation.md) data; owns no data of its
  own and never writes.
- Assumes the current salary structure is the basis for aggregates (no historical
  snapshots beyond the change log).

## 10. Risks & open questions

- **Per-currency presentation:** for orgs with many currencies, per-currency rows could
  get long — worth watching whether the UI needs a "primary currency" focus.
- **Open question:** which breakdown dimensions beyond department and country do users
  actually reach for first (designation? join-year tenure?)?
