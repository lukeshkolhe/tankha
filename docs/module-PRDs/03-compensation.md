# Module PRD — Salary & Compensation (`compensation`)

**Status:** Draft v1 · **Owner:** Product · **Scope:** MVP
**Traces to:** [`../PRD.md`](../PRD.md) — FR-3.1, FR-3.2, FR-3.3
**Depends on:** [Platform](./00-platform.md), [Workforce](./02-workforce.md)

---

## 1. Problem & why it matters

Salary is the most sensitive, most scrutinised data HR owns — and in a spreadsheet it's
the most dangerous. Manual formulas drift, a component gets typo'd, and worst of all,
**overwriting a salary cell erases the old value forever**. When an employee asks "why
was my last raise only 5%?" or an auditor asks "who approved this change and when?",
HR has no answer unless someone kept a separate change log by hand.

This module makes compensation *structured* (a small set of components with a computed
total, in the employee's own currency) and, critically, makes **every change
permanent and explained**. The change history doubles as the appraisal record — so the
audit trail is a natural by-product of doing the edit, not extra work.

## 2. Users & jobs-to-be-done

**Primary user:** HR Manager.

- *"When I set or change someone's pay, I want the total to add up automatically, so I
  never ship a formula error."*
- *"When I give a raise, I want to record why, so I can explain it later without digging
  through emails."*
- *"When anyone questions a salary, I want to see its full history in one place."*

## 3. Goals & success metrics

**Goal:** Every salary is correct-by-construction and every change is permanently
recorded with a reason.

| Metric | Target | Why it matters |
| --- | --- | --- |
| Salary changes captured with a remark | 100% (remark mandatory) | Turns edits into an audit + appraisal trail |
| Total-vs-components arithmetic errors | **0** | Total is computed, never hand-typed |
| "Explain this employee's pay history" | Answerable in-app in seconds | Directly kills the "no historical view" pain |
| Salary/currency mismatches | **0** | Salary always matches the employee's currency |

## 4. User stories & acceptance criteria

**US-1 — See an employee's current pay (P0)**
> As an HR Manager, I want to see an employee's salary broken into components with a
> clear total, so I understand exactly how they're paid.

- [ ] I see each component and the computed total, in the employee's currency.
- [ ] The total always equals the sum of components (I never edit the total directly).

**US-2 — Change a salary, with a reason (P0)**
> As an HR Manager, I want to update a salary and record why, so the change is
> explainable later.

- [ ] I can adjust components; the new total recomputes automatically.
- [ ] A remark is **required** — I can't save a change without saying why.
- [ ] Saving records who changed it, when, and the old → new values.
- [ ] Amounts can't be negative; the currency follows the employee and can't drift.

**US-3 — Review salary history (P0)**
> As an HR Manager, I want a timeline of every salary change, so I can answer questions
> about raises and appraisals without hunting through spreadsheets.

- [ ] I see all changes newest-first: date, old → new, remark, and who made it.
- [ ] History is append-only — past entries are never altered or lost.

## 5. Functional requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-3.1 | Salary as configurable components + computed total, per currency | P0 |
| FR-3.2 | HR can edit an employee's salary | P0 |
| FR-3.3 | Every change logged (timestamp, old → new, remark); serves as appraisal record | P0 |

## 6. Key user flows / UX

On the employee detail page ([Workforce](./02-workforce.md)):

- **Current breakdown** — components and total, clearly labelled with currency.
- **Edit salary** — a form where changing components live-updates the total and a
  remark field is mandatory before save.
- **History timeline** — a reverse-chronological list of changes with date, old → new,
  and remark, readable at a glance.

## 7. Out of scope (MVP)

Net pay / tax / deduction calculation, payslips, Full & Final settlement, approval
workflows, future-dated or scheduled changes, and per-org custom component *definitions*
(the component set is fixed for MVP). (See the out-of-scope list in [`../PRD.md`](../PRD.md).) The product
principle is **managing and understanding** compensation, not running payroll.

## 8. Dependencies & assumptions

- Reads the employee and their currency from [Workforce](./02-workforce.md); initial salary is set
  when the employee is created.
- Provides salary summaries back to Workforce, [Data Exchange](./04-data-exchange.md), and [Insights](./05-insights.md).
- Assumes a fixed, small set of components is enough for the MVP ("lightweight
  configurable," not a full component-definition engine).

## 9. Risks & open questions

- **Fixed component set:** if early customers need custom components (e.g. regional
  allowances), the "fixed set" assumption is the first thing to revisit.
- **Open question:** should the history capture *component-level* deltas, or is
  old-total → new-total + remark enough for MVP? (Current scope: total-level.)
